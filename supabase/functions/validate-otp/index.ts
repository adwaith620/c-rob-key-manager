import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const LOCKER_API_SECRET = Deno.env.get("LOCKER_API_SECRET");

serve(async (req) => {
  try {
    // Basic hardware authorization
    const authHeader = req.headers.get("Authorization");
    if (LOCKER_API_SECRET && authHeader !== `Bearer ${LOCKER_API_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized Hardware" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { otp } = await req.json();
    if (!otp || typeof otp !== "string") {
      return new Response(JSON.stringify({ error: "Missing OTP" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Rate-limiting strategy without booking_id sent from hardware:
    // We check the "currently active" or "soon to be active" bookings directly.
    const now = new Date().toISOString();

    // Hash incoming OTP
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otp_hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Find the OTP. To prevent abuse, we only fetch OTPs where valid_until is in the future.
    const { data: otps, error } = await supabaseAdmin
      .from("otps")
      .select("*")
      .eq("otp_hash", otp_hash)
      .gt("valid_until", now);

    if (error || !otps || otps.length === 0) {
      // If the code is just wrong, we can't increment attempts on a specific booking because we don't know who is trying.
      // In production, the IoT device might need IP-based rate limiting here to prevent scanning.
      return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const record = otps[0];

    // 1. Check Rate Limit
    if (record.locked_until && new Date(record.locked_until) > new Date()) {
      return new Response(JSON.stringify({ error: "Too many attempts. Locked." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Check if already used
    if (record.used_at) {
      return new Response(JSON.stringify({ error: "OTP already used" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Check if valid_from has passed
    if (new Date(record.valid_from) > new Date()) {
      return new Response(JSON.stringify({ error: "OTP not yet valid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // SUCCESS! Mark as used
    await supabaseAdmin.from("otps").update({ used_at: now }).eq("id", record.id);

    return new Response(JSON.stringify({ success: true, message: "Locker unlocked" }), {
      status: 200,
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
