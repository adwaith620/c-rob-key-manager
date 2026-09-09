import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { format, setHours, setMinutes, isBefore, startOfDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  startTime: z
    .string()
    .min(1, "Start time is required")
    .refine(
      (val) => {
        // Check if the selected time is in the future (allowing a 5-minute buffer)
        const selected = new Date(val).getTime();
        const now = new Date().getTime() - 5 * 60 * 1000;
        return selected > now;
      },
      { message: "Start time must be in the future" },
    ),
  durationHours: z.string().min(1, "Duration is required"),
});

function DateTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return;
    let newDate = d;
    if (selectedDate) {
      newDate = setHours(newDate, selectedDate.getHours());
      newDate = setMinutes(newDate, selectedDate.getMinutes());
    } else {
      const now = new Date();
      newDate = setHours(newDate, now.getHours() + 1);
      newDate = setMinutes(newDate, 0);
    }
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (type: "hour" | "minute", val: string) => {
    if (!selectedDate) return;
    let newDate = new Date(selectedDate);
    if (type === "hour") {
      newDate = setHours(newDate, parseInt(val, 10));
    } else {
      newDate = setMinutes(newDate, parseInt(val, 10));
    }
    onChange(newDate.toISOString());
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(selectedDate!, "MMM d, yyyy - h:mm a")
            ) : (
              <span>Select date and time</span>
            )}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border bg-card shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
          initialFocus
          className="rounded-t-md border-b border-border/10"
        />
        <div className="p-3 bg-muted/10 flex flex-col gap-2 rounded-b-md">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Start Time</span>
          </div>
          <div className="flex gap-2">
            <Select
              disabled={!selectedDate}
              value={selectedDate ? selectedDate.getHours().toString().padStart(2, "0") : undefined}
              onValueChange={(v) => handleTimeChange("hour", v)}
            >
              <SelectTrigger className="flex-1 h-9 bg-background">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground flex items-center">:</span>
            <Select
              disabled={!selectedDate}
              value={
                selectedDate ? selectedDate.getMinutes().toString().padStart(2, "0") : undefined
              }
              onValueChange={(v) => handleTimeChange("minute", v)}
            >
              <SelectTrigger className="flex-1 h-9 bg-background">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="mt-2 w-full" onClick={() => setIsOpen(false)}>
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function BookingForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "",
      durationHours: "1",
    },
  });

  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user || !supabase) throw new Error("Not authenticated");

      const localDate = new Date(values.startTime);
      const isoString = localDate.toISOString(); // converts to UTC

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          start_time: isoString,
          duration_hours: parseInt(values.durationHours, 10),
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Booking created successfully!");
      form.reset({ startTime: "", durationHours: "1" });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create booking. Time slot might overlap.");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createBooking(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-5" />
          Book Key
        </CardTitle>
        <CardDescription>Reserve the C-ROB lab key for your slot.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <DateTimePicker value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationHours"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour} hour{hour > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Request Booking"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
