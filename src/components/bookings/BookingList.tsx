import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export interface Booking {
  id: string;
  user_id: string;
  start_time: string;
  duration_hours: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export function BookingList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user || !supabase) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw new Error(error.message);
      return data as Booking[];
    },
    enabled: !!user,
  });

  const { mutate: cancelBooking } = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Booking cancelled.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel booking");
    },
  });

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">Failed to load bookings: {error.message}</div>
    );
  }

  const now = new Date();
  const upcoming =
    bookings?.filter(
      (b) => new Date(b.start_time) > now && b.status !== "cancelled" && b.status !== "completed",
    ) || [];
  const past =
    bookings
      ?.filter(
        (b) =>
          new Date(b.start_time) <= now || b.status === "cancelled" || b.status === "completed",
      )
      .reverse() || [];

  return (
    <div className="space-y-6">
      <Card className="panel">
        <CardHeader>
          <CardTitle className="text-primary">Upcoming Bookings</CardTitle>
          <CardDescription>Your scheduled key access slots.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
          ) : (
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 p-4 transition-colors hover:bg-card/60"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {format(new Date(booking.start_time), "PPP 'at' p")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Duration: {booking.duration_hours} hour{booking.duration_hours > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        booking.status === "confirmed"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-warning/20 text-warning border-warning/30"
                      }
                      variant="outline"
                    >
                      {booking.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to cancel this booking?")) {
                          cancelBooking(booking.id);
                        }
                      }}
                    >
                      <XCircle className="size-4" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="panel opacity-80">
        <CardHeader>
          <CardTitle>Past & Cancelled</CardTitle>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past bookings.</p>
          ) : (
            <div className="space-y-3">
              {past.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-card/20 p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground/80">
                      {format(new Date(booking.start_time), "PPP 'at' p")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {booking.duration_hours} hr{booking.duration_hours > 1 ? "s" : ""}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground border-border/50">
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
