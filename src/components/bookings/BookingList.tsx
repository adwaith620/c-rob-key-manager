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

  const { data: bookings, isLoading, error } = useQuery({
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
    return <div className="py-8 text-center text-muted-foreground"><Loader2 className="mx-auto size-6 animate-spin" /></div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">Failed to load bookings: {error.message}</div>;
  }

  const now = new Date();
  const upcoming = bookings?.filter((b) => new Date(b.start_time) > now && b.status !== "cancelled" && b.status !== "completed") || [];
  const past = bookings?.filter((b) => new Date(b.start_time) <= now || b.status === "cancelled" || b.status === "completed").reverse() || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
          <CardDescription>Your scheduled key access slots.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
          ) : (
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-medium">
                      {format(new Date(booking.start_time), "PPP 'at' p")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {booking.duration_hours} hour{booking.duration_hours > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
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

      <Card>
        <CardHeader>
          <CardTitle>Past & Cancelled</CardTitle>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past bookings.</p>
          ) : (
            <div className="space-y-3">
              {past.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3 opacity-70">
                  <div>
                    <div className="text-sm font-medium">
                      {format(new Date(booking.start_time), "PPP 'at' p")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.duration_hours} hr{booking.duration_hours > 1 ? "s" : ""}
                    </div>
                  </div>
                  <Badge variant="outline">{booking.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
