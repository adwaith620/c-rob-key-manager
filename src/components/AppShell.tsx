import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarClock, KeyRound, LayoutDashboard, LogOut, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, roleLabel, type Role } from "@/hooks/useAuth";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof KeyRound; roles: Role[] };

const NAV: NavItem[] = [
  { to: "/member", label: "Member Dashboard", icon: CalendarClock, roles: ["member", "execom", "admin"] },
  { to: "/execom", label: "Execom Dashboard", icon: ShieldCheck, roles: ["execom", "admin"] },
  { to: "/admin", label: "Admin Console", icon: Users, roles: ["admin"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const links = NAV.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <KeyRound className="size-5" />
          </span>
          <span className="font-display text-sm leading-tight">
            C-ROB
            <span className="block text-[10px] tracking-[0.22em] text-muted-foreground">
              KEY LOCKER
            </span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-sidebar-border bg-card/60 p-3">
          <p className="truncate text-sm font-medium">{profile?.full_name ?? "C-ROB user"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <Badge variant="secondary" className="mt-2">
            {roleLabel[role]}
          </Badge>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card/40 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <LayoutDashboard className="size-4 text-primary" />
            <span className="font-display text-xs tracking-widest">C-ROB LOCKER</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <NotificationsPanel />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login", replace: true });
              }}
            >
              <LogOut className="mr-2 size-4" /> Logout
            </Button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs",
                pathname === to ? "bg-primary/15 text-primary" : "text-muted-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
