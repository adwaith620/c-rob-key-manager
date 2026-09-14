import { Link, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  Briefcase,
  Users,
  History,
  BarChart,
  Settings,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, roleLabel } from "@/hooks/useAuth";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { CrobLogo } from "@/components/crob";
import { GradientText } from "@/components/crob";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/execom", label: "Dashboard", icon: LayoutDashboard },
  { to: "/execom/key-locker", label: "Key Locker", icon: KeyRound },
  { to: "/execom/project-requests", label: "Project Requests", icon: FileText },
  { to: "/execom/active-projects", label: "Active Projects", icon: Briefcase },
  { to: "/execom/members", label: "Members", icon: Users },
  { to: "/execom/history", label: "Activity / History", icon: History },
  { to: "/execom/reports", label: "Reports", icon: BarChart },
  { to: "/execom/settings", label: "Settings", icon: Settings },
];

export function ExecomLayout() {
  const { profile, user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Execom or Admin only
  if (role !== "execom" && role !== "admin") {
    navigate({ to: "/member", replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border md:flex sticky top-0 h-screen overflow-y-auto"
        style={{
          backgroundImage:
            "linear-gradient(180deg, oklch(0.19 0.025 265) 0%, oklch(0.16 0.02 265) 100%)",
        }}
      >
        <div className="p-5">
          <Link to="/">
            <CrobLogo size="sm" />
          </Link>
          <div className="mt-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Admin Dashboard
          </div>
        </div>

        <nav className="mt-3 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/execom" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-l-2 border-primary bg-primary/15 text-primary"
                    : "border-l-2 border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User profile card */}
        <div className="mt-auto p-4">
          <div className="rounded-lg border border-sidebar-border bg-card/60 p-3 glow-subtle">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? "C-ROB user"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-2">
              {roleLabel[role]}
            </Badge>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header — frosted glass */}
        <header className="flex items-center justify-between gap-4 border-b border-border/50 bg-background/60 px-5 py-3 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-2 md:hidden">
            <CrobLogo size="xs" showSubtext={false} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/member">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-xs">
                Switch to Member View
              </Button>
            </Link>
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

        {/* Mobile nav */}
        <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/execom" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "border border-primary/30 bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-card/60",
                )}
              >
                <Icon className="size-3" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Split title into first word (gradient) + rest */
function splitFirstWord(title: string): [string, string] {
  const idx = title.indexOf(" ");
  if (idx === -1) return [title, ""];
  return [title.slice(0, idx), title.slice(idx)];
}

export function ExecomPageHeading({
  title,
  subtitle,
  right,
}: {
  title: ReactNode;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">
          {typeof title === "string" ? (
            <>
              <GradientText>{splitFirstWord(title)[0]}</GradientText>
              {splitFirstWord(title)[1]}
            </>
          ) : (
            title
          )}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
