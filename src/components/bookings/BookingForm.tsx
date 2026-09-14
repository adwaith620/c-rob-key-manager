import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  Users,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState, useEffect } from "react";
import { format, setHours, setMinutes, isBefore, startOfDay } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const formSchema = z
  .object({
    bookingType: z.enum(["individual", "team"], {
      required_error: "Please select a booking type",
    }),
    date: z.date({
      required_error: "Date is required",
    }),
    time: z
      .string({
        required_error: "Time is required",
      })
      .min(1, "Time is required"),
    durationHours: z.string().min(1, "Duration is required"),
    purpose: z
      .string()
      .max(1000, "Purpose is too long")
      .trim()
      .optional(),
    additionalPeople: z.string().optional(),
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
  )
  .refine(
    (data) => {
      if (data.bookingType === "team") {
        const count = parseInt(data.additionalPeople || "0", 10);
        if (isNaN(count) || count < 1) return false;
      }
      return true;
    },
    {
      message: "Please enter at least 1 additional team member.",
      path: ["additionalPeople"],
    },
  )
  .refine(
    (data) => {
      if (data.bookingType === "team") {
        const count = parseInt(data.additionalPeople || "0", 10);
        if (!isNaN(count) && count > 30) return false;
      }
      return true;
    },
    {
      message: "Maximum 30 students allowed.",
      path: ["additionalPeople"],
    },
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

  // Derive initial 12-hour state from 24-hour value
  let initialH12 = "12";
  let initialM = "00";
  let initialAmPm = "AM";

  if (value && value.includes(":")) {
    const [h24, m] = value.split(":");
    const hNum = parseInt(h24, 10);
    initialM = m;
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
      const hNum = parseInt(h24, 10);
      setSelectedMinute(m);
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
    const hNum = parseInt(h24, 10);
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
      bookingType: "individual",
      time: "",
      durationHours: "1",
      purpose: "",
      additionalPeople: "",
    },
  });

  const bookingType = form.watch("bookingType");
  const purpose = form.watch("purpose");
  const additionalPeopleRaw = form.watch("additionalPeople");
  const additionalPeople = parseInt(additionalPeopleRaw || "0", 10);
  const totalPeople = isNaN(additionalPeople) ? 1 : additionalPeople + 1;

  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user || !supabase) throw new Error("Not authenticated");

      const [hours, minutes] = values.time.split(":");
      const localDate = setMinutes(
        setHours(new Date(values.date), parseInt(hours, 10)),
        parseInt(minutes, 10),
      );
      const isoString = localDate.toISOString(); // converts to UTC

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          start_time: isoString,
          duration_hours: parseInt(values.durationHours, 10),
          status: "pending",
          booking_type: values.bookingType,
          purpose_of_visit: values.purpose?.trim() || null,
          additional_people: values.bookingType === "team" ? parseInt(values.additionalPeople || "0", 10) : 0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Log the event securely
      const { error: logError } = await supabase.from("audit_logs").insert({
        action: "booking_created",
        booking_id: booking.id,
        user_id: user.id,
        booking_type: values.bookingType,
        purpose_of_visit: values.purpose?.trim() || null,
        additional_people: values.bookingType === "team" ? parseInt(values.additionalPeople || "0", 10) : 0,
      });

      if (logError) {
        console.error("Failed to write audit log:", logError);
      }

      return booking;
    },
    onSuccess: () => {
      toast.success("Booking created successfully!");
      setConflictError(false);
      form.reset({
        bookingType: "individual",
        time: "",
        durationHours: "1",
        purpose: "",
        additionalPeople: "",
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
            The selected time has already been booked by another member, or another rule was
            violated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              setConflictError(false);
            }}
          >
            Review Booking Details
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
                <FormItem className="space-y-3">
                  <FormLabel>Booking Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(val) => {
                        field.onChange(val);
                        if (val === "individual") {
                          form.setValue("additionalPeople", "");
                        }
                      }}
                      defaultValue={field.value}
                      className="flex flex-row gap-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0 border border-border/50 bg-background/50 p-3 rounded-md w-full hover:bg-accent/30 transition-colors">
                        <FormControl>
                          <RadioGroupItem value="individual" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer w-full flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          Individual
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0 border border-border/50 bg-background/50 p-3 rounded-md w-full hover:bg-accent/30 transition-colors">
                        <FormControl>
                          <RadioGroupItem value="team" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer w-full flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground" />
                          Team
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Visit (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe what you'll be working on..."
                      className="resize-none border-border/50 bg-background/50 focus-visible:ring-primary/40"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {bookingType === "team" && (
              <FormField
                control={form.control}
                name="additionalPeople"
                render={({ field }) => (
                  <FormItem className="space-y-3 rounded-xl border border-border/50 bg-background/30 p-4">
                    <div>
                      <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Users className="size-4 text-primary" />
                        Team Members
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground mt-1">
                        Tell us how many members are working in this project including you
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        placeholder="e.g. 2"
                        className="h-10 text-sm border-border/50 bg-background/50 focus-visible:ring-primary/40 w-full sm:w-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <CardFooter className="px-0 pb-0 pt-2 flex-col gap-3">
              <div className="w-full text-xs text-muted-foreground flex flex-col gap-1.5 px-1 mt-2">
                <div className="flex justify-between items-start">
                  <span>Summary:</span>
                  <span className="font-medium text-foreground/80 text-right">
                    {bookingType === "team" ? `${totalPeople} people total` : "1 person"}
                  </span>
                </div>
                {purpose && (
                  <div className="flex justify-between items-start">
                    <span>Purpose:</span>
                    <span className="font-medium text-foreground/80 text-right max-w-[200px] truncate">
                      {purpose}
                    </span>
                  </div>
                )}
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
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
