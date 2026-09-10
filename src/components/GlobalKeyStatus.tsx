import { useQuery } from "@tanstack/react-query";
import { isAfter, isBefore, addHours } from "date-fns";

import { KeyStatusBadge, type KeyStatus } from "./KeyStatusBadge";
import { supabase } from "@/lib/supabase";

export function GlobalKeyStatus() {
  const { data: status = "available" as KeyStatus, isLoading } = useQuery({
    queryKey: ["global_key_status"],
    queryFn: async (): Promise<KeyStatus> => {
      if (!supabase) return "available";

      // 1. Is the key physically out right now?
      const { data: activeSessions, error: sessionErr } = await supabase
        .from("key_sessions")
        .select("id")
        .eq("status", "active")
        .limit(1);

      if (!sessionErr && activeSessions && activeSessions.length > 0) {
        return "key-out";
      }

      // 2. Is there a booking currently active?
      // Since duration_hours isn't easily searchable via simple eq() in supabase without an RPC,
      // we'll fetch today's bookings and do the math, or we can just fetch pending/confirmed.
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const { data: activeBookings, error: bookingErr } = await supabase
        .from("bookings")
        .select("start_time, duration_hours")
        .in("status", ["pending", "confirmed"])
        .gte("start_time", startOfDay);

      if (!bookingErr && activeBookings) {
        const now = new Date();
        const hasActiveBooking = activeBookings.some((b) => {
          const start = new Date(b.start_time);
          const end = addHours(start, b.duration_hours);
          // A booking is "active" if now is within its window
          return isAfter(now, start) && isBefore(now, end);
        });

        if (hasActiveBooking) return "booked";
      }

      // Default
      return "available";
    },
    refetchInterval: 15000, // Refresh every 15s
  });

  if (isLoading) {
    return <div className="h-6 w-20 animate-pulse rounded-full bg-muted"></div>;
  }

  return <KeyStatusBadge status={status} />;
}
