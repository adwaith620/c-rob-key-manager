import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    // Webhook payload from Supabase
    const payload = await req.json();
    const booking = payload.record;

    // Only process inserts
    if (payload.type !== "INSERT" || !booking) {
      return new Response("Not an insert", { status: 200 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
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
    const { data: userAuth, error: userError } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
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
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "C-ROB Smart Locker <locker@tkmce.ac.in>", // Change if using a different verified domain
          to: email,
          subject: "Your C-ROB Locker OTP",
          html: `<p>Your booking has been confirmed.</p>
                 <p>Your one-time password to unlock the locker is: <strong style="font-size:24px;">${otp}</strong></p>
                 <p>It will be valid for exactly 10 minutes starting at <strong>${valid_from.toLocaleString()}</strong>.</p>
                 <p>Do not share this code.</p>`
        })
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
