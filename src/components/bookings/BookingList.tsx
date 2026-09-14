import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
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
  booking_type: "individual" | "team";
  team_size: number;
  purpose: string | null;
}

export function BookingList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewAllPast, setViewAllPast] = useState(false);
  const [viewAllCancelled, setViewAllCancelled] = useState(false);

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

  const pastAll =
    bookings
      ?.filter(
        (b) =>
          (new Date(b.start_time) <= now && b.status !== "cancelled") || b.status === "completed",
      )
      .reverse() || [];
  const cancelledAll = bookings?.filter((b) => b.status === "cancelled").reverse() || [];

  const past = pastAll.slice(0, 2);
  const cancelled = cancelledAll.slice(0, 2);

  const BookingCard = ({
    booking,
    showCancel = false,
  }: {
    booking: Booking;
    showCancel?: boolean;
  }) => (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 p-4 transition-colors hover:bg-card/60">
      <div className="space-y-1">
        <div className="font-medium text-foreground">
          {format(new Date(booking.start_time), "PPP 'at' p")}
        </div>
        <div className="text-sm text-muted-foreground">
          Duration: {booking.duration_hours} hr{booking.duration_hours > 1 ? "s" : ""}
          <span className="mx-2 opacity-50">•</span>
          <span className="capitalize">{booking.booking_type}</span>
          {booking.booking_type === "team" && ` (${booking.team_size} members)`}
        </div>
        {booking.purpose && booking.purpose !== "nil" && (
          <div className="text-xs text-muted-foreground/80 italic mt-1">"{booking.purpose}"</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge
          className={
            booking.status === "confirmed"
              ? "bg-primary/20 text-primary border-primary/30"
              : booking.status === "pending"
                ? "bg-warning/20 text-warning border-warning/30"
                : "bg-muted text-muted-foreground border-border/50"
          }
          variant="outline"
        >
          {booking.status}
        </Badge>
        {showCancel && booking.status !== "cancelled" && booking.status !== "completed" && (
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
        )}
      </div>
    </div>
  );

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
                <BookingCard key={booking.id} booking={booking} showCancel={true} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="panel opacity-80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Past</CardTitle>
          {pastAll.length > 2 && (
            <Button
              variant="link"
              className="text-xs h-auto p-0 text-muted-foreground"
              onClick={() => setViewAllPast(true)}
            >
              View all
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past bookings.</p>
          ) : (
            <div className="space-y-3">
              {past.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="panel opacity-80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cancelled</CardTitle>
          {cancelledAll.length > 2 && (
            <Button
              variant="link"
              className="text-xs h-auto p-0 text-muted-foreground"
              onClick={() => setViewAllCancelled(true)}
            >
              View all
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {cancelled.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cancelled bookings.</p>
          ) : (
            <div className="space-y-3">
              {cancelled.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs for View All */}
      <Dialog open={viewAllPast} onOpenChange={setViewAllPast}>
        <DialogContent className="max-w-2xl border-sidebar-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>All Past Bookings</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] mt-4 pr-4">
            <div className="space-y-4">
              {pastAll.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={viewAllCancelled} onOpenChange={setViewAllCancelled}>
        <DialogContent className="max-w-2xl border-sidebar-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>All Cancelled Bookings</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] mt-4 pr-4">
            <div className="space-y-4">
              {cancelledAll.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
