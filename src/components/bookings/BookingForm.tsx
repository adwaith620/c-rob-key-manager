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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const formSchema = z
  .object({
    date: z.date({
      required_error: "Date is required",
    }),
    time: z
      .string({
        required_error: "Time is required",
      })
      .min(1, "Time is required"),
    durationHours: z.string().min(1, "Duration is required"),
  })
  .refine(
    (data) => {
      if (!data.date || !data.time) return false;
      const [hours, minutes] = data.time.split(":");
      const combined = setMinutes(
        setHours(new Date(data.date), parseInt(hours, 10)),
        parseInt(minutes, 10),
      );
      const selected = combined.getTime();
      const now = new Date().getTime() - 5 * 60 * 1000;
      return selected > now;
    },
    { message: "Start time must be in the future", path: ["time"] },
  );

function DatePickerPopover({ value, onChange }: { value?: Date; onChange: (d?: Date) => void }) {
  const [isOpen, setIsOpen] = useState(false);

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
            {value ? format(value, "d MMMM yyyy") : <span>Select date</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border bg-card shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setIsOpen(false);
          }}
          disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
          initialFocus
          className="rounded-md border border-border/10"
        />
      </PopoverContent>
    </Popover>
  );
}

function TimePickerPopover({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const [h, m] = value && value.includes(":") ? value.split(":") : ["12", "00"];
  const [selectedHour, setSelectedHour] = useState(h);
  const [selectedMinute, setSelectedMinute] = useState(m);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    setIsOpen(false);
  };

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
            <Clock className="mr-2 h-4 w-4" />
            {value ? value : <span>Select time</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 border-border bg-card shadow-lg" align="start">
        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground text-center">Hour</span>
            <ScrollArea className="h-48 w-16 rounded-md border border-border/50">
              <div className="flex flex-col p-1">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    type="button"
                    variant={selectedHour === hour ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-full text-xs mb-1"
                    onClick={() => setSelectedHour(hour)}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground text-center">Minute</span>
            <ScrollArea className="h-48 w-16 rounded-md border border-border/50">
              <div className="flex flex-col p-1">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    type="button"
                    variant={selectedMinute === minute ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-full text-xs mb-1"
                    onClick={() => setSelectedMinute(minute)}
                  >
                    {minute}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Button type="button" size="sm" className="mt-4 w-full" onClick={handleConfirm}>
          Confirm
        </Button>
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
      time: "",
      durationHours: "1",
    },
  });

  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user || !supabase) throw new Error("Not authenticated");

      const [hours, minutes] = values.time.split(":");
      const localDate = setMinutes(
        setHours(new Date(values.date), parseInt(hours, 10)),
        parseInt(minutes, 10),
      );
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
      form.reset({ time: "", durationHours: "1" });
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <DatePickerPopover value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Time</FormLabel>
                    <TimePickerPopover value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4">
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
