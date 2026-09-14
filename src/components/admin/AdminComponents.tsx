import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Box,
  Calendar,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

export function OverviewSection() {
  const { data: usersCount, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin_users_count"],
    queryFn: async () => {
      if (!supabase) return 0;
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: bookingsStats, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["admin_bookings_stats"],
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.from("bookings").select("status");
      if (error) throw error;

      return {
        total: data.length,
        pending: data.filter((b) => b.status === "pending").length,
        active: data.filter((b) => b.status === "confirmed").length,
        completed: data.filter((b) => b.status === "completed").length,
        cancelled: data.filter((b) => b.status === "cancelled").length,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="panel bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingUsers ? "-" : usersCount}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="panel bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Activity className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoadingBookings ? "-" : bookingsStats?.active}
            </div>
            <p className="text-xs text-muted-foreground">Currently confirmed slots</p>
          </CardContent>
        </Card>

        <Card className="panel bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Calendar className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {isLoadingBookings ? "-" : bookingsStats?.pending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="panel bg-card/40 opacity-70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lockers</CardTitle>
            <Box className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-destructive">No locker data</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="panel">
          <CardHeader>
            <CardTitle>Booking Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border/10 pb-2">
                <span className="text-sm text-muted-foreground">Total Bookings</span>
                <span className="font-semibold">
                  {isLoadingBookings ? "-" : bookingsStats?.total}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border/10 pb-2">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-semibold text-green-500">
                  {isLoadingBookings ? "-" : bookingsStats?.completed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                <span className="font-semibold text-destructive">
                  {isLoadingBookings ? "-" : bookingsStats?.cancelled}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel opacity-70">
          <CardHeader>
            <CardTitle>Locker Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Locker tracking not initialized. Wait for IoT synchronization to populate locker data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function BookingsSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin_bookings"],
    queryFn: async () => {
      if (!supabase) return [];
      // In a real app we'd join profiles to get user names, but we can do our best.
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase!.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bookings"] });
      toast.success("Booking updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = bookings?.filter((b) => b.id.includes(search)) ?? []; // Just show all for now

  return (
    <Card className="panel">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Booking Management</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto bg-card/20 rounded-md border border-border/30">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="animate-pulse">
                  <TableCell colSpan={5} className="text-center h-24">
                    Loading bookings...
                  </TableCell>
                </TableRow>
              ) : bookings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{format(new Date(b.start_time), "PPP")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(b.start_time), "p")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="capitalize">
                        <b>{b.booking_type}</b>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.additional_people + 1} people
                      </div>
                    </TableCell>
                    <TableCell>{b.duration_hours} hr</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          b.status === "confirmed"
                            ? "text-primary border-primary/30"
                            : b.status === "pending"
                              ? "text-warning border-warning/30"
                              : b.status === "cancelled"
                                ? "text-destructive border-destructive/30"
                                : "text-green-500 border-green-500/30"
                        }
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateBooking.mutate({ id: b.id, status: "confirmed" })}
                            disabled={b.status === "confirmed" || updateBooking.isPending}
                          >
                            <CheckCircle className="mr-2 size-4" /> Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateBooking.mutate({ id: b.id, status: "completed" })}
                            disabled={b.status === "completed" || updateBooking.isPending}
                          >
                            <Clock className="mr-2 size-4" /> Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateBooking.mutate({ id: b.id, status: "cancelled" })}
                            className="text-destructive"
                            disabled={b.status === "cancelled" || updateBooking.isPending}
                          >
                            <XCircle className="mr-2 size-4" /> Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogsSection() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin_audit_logs"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="panel">
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground animate-pulse">Loading logs...</div>
          ) : logs?.length === 0 ? (
            <div className="text-center text-muted-foreground">No logs found.</div>
          ) : (
            logs?.map((log: any) => (
              <div
                key={log.id}
                className="p bg-card/30 border border-border/30 rounded-md p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Booking: {log.booking_id || "N/A"} | User: {log.user_id || "N/A"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), "PPP p")}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
