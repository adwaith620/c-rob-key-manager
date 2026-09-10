import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarClock, KeyRound, LogOut, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, roleLabel, type Role } from "@/hooks/useAuth";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { CrobLogo } from "@/components/crob";
import { GradientText } from "@/components/crob";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof KeyRound; roles: Role[] };

const NAV: NavItem[] = [
  {
    to: "/member",
    label: "Member Dashboard",
    icon: CalendarClock,
    roles: ["member", "execom", "admin"],
  },
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
        </div>

        <nav className="mt-3 space-y-1 px-3">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
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
        <header className="flex items-center justify-between gap-4 border-b border-border/50 bg-background/60 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 md:hidden">
            <CrobLogo size="xs" showSubtext={false} />
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

        {/* Mobile nav */}
        <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors",
                pathname === to
                  ? "border border-primary/30 bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-card/60",
              )}
            >
              <Icon className="size-3" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-5 md:p-8">{children}</main>
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

export function PageHeading({
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
