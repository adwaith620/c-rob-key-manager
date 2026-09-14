import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Loader2, Calendar as CalendarIcon, Clock, User, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useEffect } from "react";
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

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    bookingType: z.enum(["individual", "team"], {
      required_error: "Booking type is required",
    }),
    teamSize: z.coerce.number().optional(),
    purpose: z.string().max(500, "Purpose cannot exceed 500 characters").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.date && data.time) {
      const [hours, minutes] = data.time.split(":");
      const combined = setMinutes(
        setHours(new Date(data.date), parseInt(hours || "0", 10)),
        parseInt(minutes || "0", 10),
      );
      const selected = combined.getTime();
      const now = new Date().getTime() - 5 * 60 * 1000;
      if (selected <= now) {
        ctx.addIssue({
          code: "custom",
          message: "Start time must be in the future",
          path: ["time"],
        });
      }
    }
    if (data.bookingType === "team") {
      if (data.teamSize === undefined || isNaN(data.teamSize) || data.teamSize === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Please enter the number of members attending.",
          path: ["teamSize"],
        });
      } else if (data.teamSize < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Team booking must include at least 2 members.",
          path: ["teamSize"],
        });
      } else if (data.teamSize > 30) {
        ctx.addIssue({
          code: "custom",
          message: "Team booking cannot include more than 30 members.",
          path: ["teamSize"],
        });
      } else if (!Number.isInteger(data.teamSize)) {
        ctx.addIssue({
          code: "custom",
          message: "Team size must be an integer.",
          path: ["teamSize"],
        });
      }
    }
  });

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

  // Derive initial 12-hour state from 24-hour value
  let initialH12 = "12";
  let initialM = "00";
  let initialAmPm = "AM";

  if (value && value.includes(":")) {
    const [h24, m] = value.split(":");
    const hNum = parseInt(h24 || "0", 10);
    initialM = m || "00";
    initialAmPm = hNum >= 12 ? "PM" : "AM";
    let h12Num = hNum % 12;
    if (h12Num === 0) h12Num = 12;
    initialH12 = h12Num.toString();
  }

  const [selectedHour12, setSelectedHour12] = useState(initialH12);
  const [selectedMinute, setSelectedMinute] = useState(initialM);
  const [selectedAmPm, setSelectedAmPm] = useState(initialAmPm);

  // Sync internal state when opened, so it always matches external form value
  useEffect(() => {
    if (isOpen && value && value.includes(":")) {
      const [h24, m] = value.split(":");
      const hNum = parseInt(h24 || "0", 10);
      setSelectedMinute(m || "00");
      setSelectedAmPm(hNum >= 12 ? "PM" : "AM");
      let h12Num = hNum % 12;
      if (h12Num === 0) h12Num = 12;
      setSelectedHour12(h12Num.toString());
    }
  }, [isOpen, value]);

  const hours12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ["00", "15", "30", "45"];
  const amPmOptions = ["AM", "PM"];

  const handleConfirm = () => {
    let finalHour = parseInt(selectedHour12, 10);
    if (selectedAmPm === "PM" && finalHour !== 12) {
      finalHour += 12;
    } else if (selectedAmPm === "AM" && finalHour === 12) {
      finalHour = 0;
    }
    const finalHourStr = finalHour.toString().padStart(2, "0");
    onChange(`${finalHourStr}:${selectedMinute}`);
    setIsOpen(false);
  };

  // Format display value for the button
  let displayValue = "";
  if (value && value.includes(":")) {
    const [h24, m2] = value.split(":");
    const hNum = parseInt(h24 || "0", 10);
    const pm = hNum >= 12;
    let h12 = hNum % 12;
    if (h12 === 0) h12 = 12;
    displayValue = `${h12}:${m2} ${pm ? "PM" : "AM"}`;
  }

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
            {displayValue ? displayValue : <span>Select time</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 border-border bg-card shadow-lg" align="start">
        <div className="flex gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground text-center">Hour</span>
            <ScrollArea className="h-48 w-14 rounded-md border border-border/50">
              <div className="flex flex-col p-1">
                {hours12.map((hour) => (
                  <Button
                    key={hour}
                    type="button"
                    variant={selectedHour12 === hour ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-full text-xs mb-1 px-0"
                    onClick={() => setSelectedHour12(hour)}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground text-center">Minute</span>
            <ScrollArea className="h-48 w-14 rounded-md border border-border/50">
              <div className="flex flex-col p-1">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    type="button"
                    variant={selectedMinute === minute ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-full text-xs mb-1 px-0"
                    onClick={() => setSelectedMinute(minute)}
                  >
                    {minute}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground text-center">AM/PM</span>
            <div className="flex flex-col gap-1 p-1 rounded-md border border-border/50 h-48 justify-start">
              {amPmOptions.map((period) => (
                <Button
                  key={period}
                  type="button"
                  variant={selectedAmPm === period ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-full text-xs px-0"
                  onClick={() => setSelectedAmPm(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
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
  const [conflictError, setConflictError] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: "",
      durationHours: "1",
      bookingType: undefined as unknown as "individual",
      purpose: "",
    },
  });

  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user || !supabase) throw new Error("Not authenticated");

      const [hours, minutes] = values.time.split(":");
      const localDate = setMinutes(
        setHours(new Date(values.date), parseInt(hours || "0", 10)),
        parseInt(minutes || "0", 10),
      );
      const isoString = localDate.toISOString(); // converts to UTC

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          start_time: isoString,
          duration_hours: parseInt(values.durationHours, 10),
          status: "pending",
          booking_type: values.bookingType,
          team_size: values.bookingType === "individual" ? 1 : values.teamSize,
          purpose: values.purpose && values.purpose.trim() !== "" ? values.purpose.trim() : null,
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
      setConflictError(false);
      form.reset({
        time: "",
        durationHours: "1",
        bookingType: "individual",
        purpose: "",
        teamSize: undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: Error) => {
      if (
        error.message.includes("overlap") ||
        error.message.includes("constraint") ||
        error.message.includes("Failed to create booking")
      ) {
        setConflictError(true);
      } else {
        toast.error(error.message || "Failed to create booking. Time slot might overlap.");
        setConflictError(true); // Default to conflict UI for safety on insert errors
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setConflictError(false);
    createBooking(values);
  }

  if (conflictError) {
    return (
      <Card className="panel border-destructive/40 bg-destructive/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CalendarClock className="size-24 text-destructive" />
        </div>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <CalendarClock className="size-5" />
            Slot no longer available
          </CardTitle>
          <CardDescription className="text-foreground/80">
            The selected time has already been booked by another member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              setConflictError(false);
              form.reset({ time: "", durationHours: "1" });
            }}
          >
            Choose another slot
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          Book Key
        </CardTitle>
        <CardDescription>Reserve the C-ROB lab key for your slot.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bookingType"
              render={({ field }) => (
                <FormItem className="space-y-5">
                  <FormLabel className="text-base text-foreground/90 font-medium">
                    Booking Type
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange("individual")}
                        className={cn(
                          "flex flex-col items-start gap-2.5 p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          field.value === "individual"
                            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)]"
                            : "border-border/50 bg-card/20 hover:bg-card/40 hover:border-primary/50",
                        )}
                        aria-pressed={field.value === "individual"}
                      >
                        {field.value === "individual" && (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        )}
                        <User
                          className={cn(
                            "size-5",
                            field.value === "individual" ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <div>
                          <div
                            className={cn(
                              "font-medium",
                              field.value === "individual" ? "text-primary" : "text-foreground",
                            )}
                          >
                            Individual
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Book the locker for yourself
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange("team")}
                        className={cn(
                          "flex flex-col items-start gap-2.5 p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          field.value === "team"
                            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)]"
                            : "border-border/50 bg-card/20 hover:bg-card/40 hover:border-primary/50",
                        )}
                        aria-pressed={field.value === "team"}
                      >
                        {field.value === "team" && (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                        )}
                        <Users
                          className={cn(
                            "size-5",
                            field.value === "team" ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <div>
                          <div
                            className={cn(
                              "font-medium",
                              field.value === "team" ? "text-primary" : "text-foreground",
                            )}
                          >
                            Team
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Book the locker for a project team
                          </div>
                        </div>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("bookingType") && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 fill-mode-forwards">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-4">
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
                      <FormItem className="flex flex-col gap-4">
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
                      <FormItem className="flex flex-col gap-4">
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
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

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel>
                          Purpose of Visit{" "}
                          <span className="text-muted-foreground text-xs font-normal">
                            (Optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe what you'll be working on..."
                            className="resize-none h-20 bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("bookingType") === "team" && (
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem className="rounded-xl border border-border/50 bg-card/20 p-4 space-y-3 mt-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Users className="size-4 text-primary" /> Team Members
                          </div>
                          <FormLabel className="text-sm text-muted-foreground font-normal leading-relaxed block">
                            How many people are there in your team including you
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="2"
                              max="30"
                              step="1"
                              placeholder="e.g. 2"
                              className="w-full sm:w-32 bg-background"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber || e.target.value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-1 text-sm border-t border-border/20 mt-2 gap-2">
                  <span className="text-muted-foreground">Summary:</span>
                  <span className="font-semibold text-foreground">
                    {form.watch("bookingType") === "individual"
                      ? "1 person · Individual booking"
                      : `${form.watch("teamSize") && !isNaN(form.watch("teamSize") as number) ? form.watch("teamSize") : 2} people · Team booking`}
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="crobPrimary"
                  glow
                  className="w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Request Booking"
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
