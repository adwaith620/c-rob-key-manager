import { useQuery } from "@tanstack/react-query";
import { format, addDays, subDays, isSameDay, startOfDay, endOfDay, isBefore } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function DailySchedule() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expanded, setExpanded] = useState(false);

  const isToday = isSameDay(selectedDate, new Date());

  // Prevent navigating to the past
  const canGoBack = !isBefore(startOfDay(selectedDate), startOfDay(new Date())) && !isToday;

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule", selectedDate.toISOString()],
    queryFn: async () => {
      if (!supabase) return [];

      const rangeStart = startOfDay(selectedDate).toISOString();
      const rangeEnd = endOfDay(selectedDate).toISOString();

      // Uses the secure RPC function to fetch minimal public info (names and times)
      // without exposing sensitive profile data or violating RLS.
      const { data, error } = await supabase.rpc("get_schedule_in_range", {
        range_start: rangeStart,
        range_end: rangeEnd,
      });

      if (error) {
        console.error("Failed to fetch schedule:", error);
        return [];
      }
      return data || [];
    },
  });

  const handlePrevDay = () => {
    if (canGoBack) setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const visibleBookings = expanded ? schedule : schedule?.slice(0, 3);
  const hasMore = schedule && schedule.length > 3;

  return (
    <Card className="flex flex-col h-full bg-card/50">
      <CardHeader className="pb-3 border-b border-border/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="size-4" />
            {isToday ? "Today's Bookings" : `Bookings — ${format(selectedDate, "d MMMM")}`}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !schedule || schedule.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-md">
              No bookings scheduled.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleBookings?.map((booking: any) => {
                const start = new Date(booking.start_time);
                const end = new Date(start.getTime() + booking.duration_hours * 3600000);
                const isOwnBooking = booking.user_id === user?.id;

                return (
                  <div
                    key={booking.id}
                    className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                      isOwnBooking
                        ? "bg-primary/5 border-primary/20"
                        : "bg-background border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium tabular-nums text-foreground/90">
                        {format(start, "hh:mm a")} – {format(end, "hh:mm a")}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        {booking.full_name?.split(" ")[0] || "Member"}
                        {isOwnBooking && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!expanded && hasMore && (
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setExpanded(true)}
                  >
                    Show all {schedule.length} bookings ↓
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {(expanded || !isToday) && (
          <div className="p-3 border-t border-border/10 bg-muted/10 flex items-center justify-between mt-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevDay}
              disabled={!canGoBack}
              className="text-xs"
            >
              <ChevronLeft className="mr-1 size-3" /> Previous
            </Button>
            <div className="text-xs font-medium text-muted-foreground">
              {format(selectedDate, "MMM d, yyyy")}
            </div>
            <Button variant="ghost" size="sm" onClick={handleNextDay} className="text-xs">
              Next <ChevronRight className="ml-1 size-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
