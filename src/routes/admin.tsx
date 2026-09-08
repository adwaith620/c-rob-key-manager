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

  if (loading) return null;

  // Protect route strictly for admins
  if (!user || role !== "admin") {
    return <Navigate to="/member" replace />;
  }

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
      if (userId === user.id) throw new Error("You cannot change your own role.");
      const { error } = await supabase!.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_users"] }),
    onError: (e: any) => alert(e.message)
  });

  const filteredUsers = users?.filter((u) => 
    (u.full_name?.toLowerCase().includes(search.toLowerCase())) || 
    (u.email?.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <AppShell>
      <PageHeading
        title="Admin Console"
        subtitle="Manage user roles and monitor system access."
      />

      <div className="grid gap-6">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <Users className="size-5 text-primary" />
              Registered Users
              <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                {users?.length || 0} total
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name or email..."
                className="w-full pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role / Access Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground animate-pulse">
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
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.full_name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5" title={u.id}>
                            {u.id.split('-')[0]}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{u.email || "—"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{u.phone || "No phone"}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(u.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(val: Role) => updateRole.mutate({ userId: u.id, newRole: val })}
                            disabled={isSelf || updateRole.isPending}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="execom">Execom</SelectItem>
                              <SelectItem value="admin" className="text-destructive font-bold focus:text-destructive">
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

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/20 p-2">
              <ShieldAlert className="size-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
                As an Administrator, you have full authority to modify user roles. 
                Assigning someone the <strong>Admin</strong> role gives them the ability to demote you or other admins. 
                Assigning <strong>Execom</strong> gives them physical override capabilities on the lockers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
