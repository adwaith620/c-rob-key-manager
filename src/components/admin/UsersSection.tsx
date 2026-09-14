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
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function UsersSection({ filterRole, title }: { filterRole?: string; title?: string } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_users", filterRole],
    queryFn: async () => {
      if (!supabase) throw new Error("No supabase");
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (filterRole) {
        query = query.eq("role", filterRole);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      if (user && userId === user.id) throw new Error("You cannot change your own role.");
      const { error } = await supabase!.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("User role updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredUsers =
    users?.filter(
      (u: any) =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  return (
    <Card className="panel fade-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title || "Member Management"}</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
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
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="animate-pulse">
                  <TableCell colSpan={4} className="text-center h-24">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u: any) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.full_name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {u.id.split("-")[0]}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{u.email || "�"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {u.phone || "No phone"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(val) => updateRole.mutate({ userId: u.id, newRole: val })}
                          disabled={isSelf || updateRole.isPending}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="execom" className="text-warning">
                              Execom
                            </SelectItem>
                            <SelectItem value="admin" className="text-destructive font-bold">
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
      </CardContent>
    </Card>
  );
}
