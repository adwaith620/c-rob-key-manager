import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ShieldCheck, ArrowRightLeft, User, Clock } from "lucide-react";
import { formatDistanceToNow, isAfter, addHours } from "date-fns";

import { AppShell, PageHeading } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobalKeyStatus } from "@/components/GlobalKeyStatus";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/execom")({
  component: ExecomDashboard,
});

function ExecomDashboard() {
  const { user, profile, role, loading } = useAuth();
  const queryClient = useQueryClient();

  if (loading) return null;

  // Protect route
  if (!user || (role !== "execom" && role !== "admin")) {
    return <Navigate to="/member" replace />;
  }

  // 1. Fetch all active key sessions lab-wide
  const { data: activeSessions, isLoading } = useQuery({
    queryKey: ["execom_active_sessions"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("key_sessions")
        .select("*, holder:profiles!current_holder(id, full_name, role, email), bookings(start_time, duration_hours, user_id, booker:profiles!user_id(id, full_name))")
        .eq("status", "active")
        .order("started_at", { ascending: false });

      if (error) console.error(error);
      return data || [];
    },
    refetchInterval: 10000,
  });

  // 2. Fetch pending handovers we initiated
  const { data: pendingHandovers } = useQuery({
    queryKey: ["execom_pending_handovers"],
    queryFn: async () => {
      if (!user || !supabase) return [];
      const { data } = await supabase
        .from("handovers")
        .select("*")
        .eq("from_user_id", user.id)
        .eq("status", "pending_acceptance");
      return data || [];
    },
    refetchInterval: 10000,
  });

  const requestTakeover = useMutation({
    mutationFn: async ({ sessionId, currentHolderId }: { sessionId: string; currentHolderId: string }) => {
      const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
      const { error } = await supabase!.from("handovers").insert({
        session_id: sessionId,
        from_user_id: currentHolderId,
        to_user_id: user!.id,
        status: "pending_acceptance",
        expires_at: expiresAt
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["execom_active_sessions"] }),
    onError: (e) => alert(e.message)
  });

  const returnAuthority = useMutation({
    mutationFn: async ({ sessionId, originalBookerId }: { sessionId: string; originalBookerId: string }) => {
      const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
      const { error } = await supabase!.from("handovers").insert({
        session_id: sessionId,
        from_user_id: user!.id,
        to_user_id: originalBookerId,
        status: "pending_acceptance",
        expires_at: expiresAt
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["execom_pending_handovers"] }),
    onError: (e) => alert(e.message)
  });

  return (
    <AppShell>
      <PageHeading
        title="Execom Dashboard"
        subtitle="Lab-wide overview of physical key custody."
        right={<GlobalKeyStatus />}
      />

      <div className="grid gap-6">
        <Card className="border-warning/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-warning" />
              Active Key Custody
            </CardTitle>
            <CardDescription>Real-time view of who physically holds the C-ROB key right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground animate-pulse">Scanning lab status...</div>
            ) : activeSessions?.length === 0 ? (
              <div className="text-sm text-muted-foreground">The key is currently safely inside the locker.</div>
            ) : (
              <div className="space-y-4">
                {activeSessions?.map((session) => {
                  const holder = session.holder as any;
                  const booking = session.bookings as any;
                  const booker = booking.booker as any;
                  
                  const isHolderAdmin = holder.role === "admin" || holder.role === "execom";
                  const end = addHours(new Date(booking.start_time), booking.duration_hours);
                  const isOverdue = isAfter(new Date(), end);

                  const weAreHolder = holder.id === user?.id;
                  const pendingTakeover = false; // We could check handovers where to_user_id = us, but UI is simpler

                  return (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <User className="size-4" />
                          {holder.full_name}
                          {isHolderAdmin && <span className="text-[10px] uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold tracking-wider">{holder.role}</span>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Booked by: {booker.full_name} • Started {formatDistanceToNow(new Date(session.started_at))} ago
                        </div>
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-xs text-destructive mt-2 font-semibold">
                            <Clock className="size-3" /> Overdue by {formatDistanceToNow(end)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {weAreHolder ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/30"
                            onClick={() => returnAuthority.mutate({ sessionId: session.id, originalBookerId: booker.id })}
                            disabled={holder.id === booker.id} // Don't return if we were the booker
                          >
                            <ArrowRightLeft className="mr-2 size-4" />
                            Return Authority to Booker
                          </Button>
                        ) : !isHolderAdmin ? (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => requestTakeover.mutate({ sessionId: session.id, currentHolderId: holder.id })}
                          >
                            <ShieldCheck className="mr-2 size-4" />
                            Request Takeover
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground uppercase font-semibold">Under Execom Auth</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
