import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ShieldAlert, Users, Search, Activity } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

import { AppShell, PageHeading } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth, roleLabel, type Role } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminConsole,
});

function AdminConsole() {
  const { user, role, loading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // 1. Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      return data || [];
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: Role }) => {
      if (user && userId === user.id) throw new Error("You cannot change your own role.");
      const { error } = await supabase!.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_users"] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (e: any) => alert(e.message),
  });

  if (loading) return null;

  // Protect route strictly for admins
  if (!user || role !== "admin") {
    return <Navigate to="/member" replace />;
  }

  const filteredUsers =
    users?.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  return (
    <AppShell>
      <PageHeading title="Admin Console" subtitle="Manage user roles and monitor system access." />

      <AnimatedSection animation="fade-in" delay={100} className="grid gap-6">
        <div className="panel overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-b border-border/50 bg-card/40">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Users className="size-5" />
              Registered Users
              <span className="ml-2 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs text-primary border border-primary/30">
                {users?.length || 0} total
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name or email..."
                className="w-full pl-8 bg-background/50 border-border/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-card/20">
            <Table>
              <TableHeader className="bg-card/40">
                <TableRow className="border-border/50">
                  <TableHead className="text-foreground/80">User</TableHead>
                  <TableHead className="text-foreground/80">Contact</TableHead>
                  <TableHead className="text-foreground/80">Joined</TableHead>
                  <TableHead className="text-foreground/80">Role / Access Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground animate-pulse"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No users found matching "{search}".
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === user.id;
                    return (
                      <TableRow key={u.id} className="border-border/30 hover:bg-card/40">
                        <TableCell>
                          <div className="font-medium text-foreground">{u.full_name}</div>
                          <div
                            className="text-xs text-muted-foreground font-mono mt-0.5"
                            title={u.id}
                          >
                            {u.id.split("-")[0]}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground/90">{u.email || "—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {u.phone || "No phone"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(u.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(val: Role) =>
                              updateRole.mutate({ userId: u.id, newRole: val })
                            }
                            disabled={isSelf || updateRole.isPending}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs font-semibold bg-background/50 border-border/60">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-border/60 bg-card">
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="execom" className="text-warning">
                                Execom
                              </SelectItem>
                              <SelectItem
                                value="admin"
                                className="text-destructive font-bold focus:text-destructive"
                              >
                                Admin
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="panel border-destructive/40 bg-destructive/5 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-destructive/10 to-transparent pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="rounded-xl bg-destructive/20 p-2.5 border border-destructive/30">
              <ShieldAlert className="size-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-destructive text-lg">Danger Zone</h3>
              <p className="mt-1 text-sm text-foreground/80 max-w-3xl leading-relaxed">
                As an Administrator, you have full authority to modify user roles. Assigning someone
                the <strong className="text-foreground">Admin</strong> role gives them the ability
                to demote you or other admins. Assigning{" "}
                <strong className="text-warning">Execom</strong> gives them physical override
                capabilities on the lockers.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </AppShell>
  );
}
