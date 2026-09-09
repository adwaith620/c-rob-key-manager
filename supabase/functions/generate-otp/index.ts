import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

serve(async (req) => {
  try {
    // 1. Webhook Security Validation
    // Expecting the Supabase Webhook to pass this in the Authorization header: Bearer <SECRET>
    const authHeader = req.headers.get("Authorization");
    if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response("Unauthorized Webhook", { status: 401 });
    }

    const payload = await req.json();

    // 2. OTP generation is no longer handled immediately on INSERT.
    // It is now handled Just-In-Time by the cron-notifier at the actual
    // booking start_time. This prevents OTPs from expiring before the slot begins.
    return new Response("Webhook acknowledged. OTP generation delegated to cron.", { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
