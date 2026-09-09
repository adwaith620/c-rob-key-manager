import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

serve(async (req) => {
  try {
    // 1. Webhook Security Validation
    // Expecting the Supabase Webhook to pass this in the Authorization header: Bearer <SECRET>
    const authHeader = req.headers.get("Authorization");
    if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response("Unauthorized Webhook", { status: 401 });
    }

    // Webhook payload from Supabase
    const payload = await req.json();
    const booking = payload.record;

    // Only process inserts
    if (payload.type !== "INSERT" || !booking) {
      return new Response("Not an insert", { status: 200 });
    }

    // 2. Cryptographically Secure OTP Generation
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Use modulo arithmetic to ensure a 6 digit number between 100000 and 999999
    const otp = (Math.floor(array[0] % 900000) + 100000).toString();

    // Hash the OTP (SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otp_hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get user email
    const { data: userAuth, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      booking.user_id,
    );
    const email = userAuth?.user?.email;

    if (!email || userError) {
      console.error("User email not found or error:", userError);
      return new Response("User not found", { status: 400 });
    }

    const valid_from = new Date(booking.start_time);
    const valid_until = new Date(valid_from.getTime() + 10 * 60000); // 10 minutes validity

    // Insert into otps table
    const { error: insertError } = await supabaseAdmin.from("otps").insert({
      booking_id: booking.id,
      otp_hash: otp_hash,
      valid_from: valid_from.toISOString(),
      valid_until: valid_until.toISOString(),
    });

    if (insertError) {
      console.error("Failed to save OTP:", insertError);
      return new Response("Database error", { status: 500 });
    }

    // Send email via Resend
    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // TEMPORARY TESTING SENDER: onboarding@resend.dev bypasses domain verification limits
          // but only works if sending to the verified Resend account owner's email address.
          // MUST REPLACE WITH A VERIFIED DOMAIN BEFORE PRODUCTION!
          from: "onboarding@resend.dev",
          to: email,
          subject: "Your C-ROB Locker OTP",
          html: `<p>Your booking has been confirmed.</p>
                 <p>Your one-time password to unlock the locker is: <strong style="font-size:24px;">${otp}</strong></p>
                 <p>It will be valid for exactly 10 minutes starting at <strong>${valid_from.toLocaleString()}</strong>.</p>
                 <p>Do not share this code.</p>`,
        }),
      });

      if (!res.ok) {
        console.error("Resend error:", await res.text());
        return new Response("Email failed to send", { status: 500 });
      }
    } else {
      console.warn("RESEND_API_KEY is not set. OTP generated but not emailed.");
    }

    return new Response("OTP generated and sent", { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
