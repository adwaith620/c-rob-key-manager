import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const LOCKER_API_SECRET = Deno.env.get("LOCKER_API_SECRET");

serve(async (req) => {
  try {
    // 1. Hardware Authorization
    const authHeader = req.headers.get("Authorization");
    if (LOCKER_API_SECRET && authHeader !== `Bearer ${LOCKER_API_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized Hardware" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const { action, esp32_id, esp32_timestamp, idempotency_key } = payload;

    if (!action || !esp32_id || !esp32_timestamp || !idempotency_key) {
      return new Response(JSON.stringify({ error: "Missing required base fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Protect against severe replay attacks (event timestamp must be within 5 mins of server)
    const eventTime = new Date(esp32_timestamp).getTime();
    const nowTime = Date.now();
    if (Math.abs(nowTime - eventTime) > 5 * 60000) {
      return new Response(JSON.stringify({ error: "Timestamp too old or too far in future" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // ==========================================
    // ACTION: validate_otp
    // ==========================================
    if (action === "validate_otp") {
      const { otp } = payload;
      if (!otp)
        return new Response(JSON.stringify({ error: "Missing OTP" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });

      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(otp));
      const otp_hash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const nowStr = new Date().toISOString();
      const { data: otps, error } = await supabaseAdmin
        .from("otps")
        .select("id, booking_id, used_at, locked_until, valid_from")
        .eq("otp_hash", otp_hash)
        .gt("valid_until", nowStr);

      if (error || !otps || otps.length === 0) {
        await logHardwareEvent(
          supabaseAdmin,
          esp32_id,
          "authentication_failure",
          esp32_timestamp,
          idempotency_key,
        );
        return new Response(JSON.stringify({ success: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const record = otps[0];

      // Rate limit / Usage checks
      if (
        (record.locked_until && new Date(record.locked_until) > new Date()) ||
        record.used_at ||
        new Date(record.valid_from) > new Date()
      ) {
        await logHardwareEvent(
          supabaseAdmin,
          esp32_id,
          "authentication_failure",
          esp32_timestamp,
          idempotency_key,
          record.booking_id,
        );
        return new Response(JSON.stringify({ success: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Success
      await supabaseAdmin.from("otps").update({ used_at: nowStr }).eq("id", record.id);
      await logHardwareEvent(
        supabaseAdmin,
        esp32_id,
        "authentication_success",
        esp32_timestamp,
        idempotency_key,
        record.booking_id,
      );

      return new Response(
        JSON.stringify({ success: true, unlock_duration: 5000, booking_id: record.booking_id }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // ==========================================
    // ACTION: report_event
    // ==========================================
    if (action === "report_event") {
      const { event_type, booking_id } = payload;
      if (!event_type)
        return new Response(JSON.stringify({ error: "Missing event_type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });

      // 1. Check idempotency (insert event)
      const eventResult = await logHardwareEvent(
        supabaseAdmin,
        esp32_id,
        event_type,
        esp32_timestamp,
        idempotency_key,
        booking_id,
      );

      // If the event already existed (idempotency key collision), we gracefully acknowledge.
      if (eventResult.error && eventResult.error.code === "23505") {
        return new Response(JSON.stringify({ acknowledged: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (eventResult.error) {
        throw new Error(eventResult.error.message);
      }

      // 2. State Machine Logic
      if (event_type === "key_removed" && booking_id) {
        // Need to find the user_id for this booking
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select("user_id")
          .eq("id", booking_id)
          .single();
        if (booking) {
          // Strictly, we should check if the last event was locker_opened.
          // For resilience, if the key is removed and we know the booking, we start the session.
          await supabaseAdmin.from("key_sessions").insert({
            booking_id: booking_id,
            current_holder: booking.user_id,
            started_at: new Date(esp32_timestamp).toISOString(),
            status: "active",
          });
        }
      }

      if (event_type === "key_returned" && booking_id) {
        // Close the active session for this booking
        await supabaseAdmin
          .from("key_sessions")
          .update({
            ended_at: new Date(esp32_timestamp).toISOString(),
            status: "completed",
          })
          .eq("booking_id", booking_id)
          .eq("status", "active");
      }

      return new Response(JSON.stringify({ acknowledged: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// Helper to log hardware events
async function logHardwareEvent(
  supabaseAdmin: any,
  esp32_id: string,
  event_type: string,
  esp32_timestamp: string,
  idempotency_key: string,
  booking_id?: string,
) {
  return await supabaseAdmin.from("hardware_events").insert({
    esp32_id,
    event_type,
    booking_id: booking_id || null,
    esp32_timestamp: new Date(esp32_timestamp).toISOString(),
    idempotency_key,
  });
}
