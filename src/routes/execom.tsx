import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  Activity,
  Box,
  Calendar,
  Key,
  Users,
  ShieldCheck,
  Fingerprint,
  FileText,
  Settings,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeading } from "@/components/AppShell";
import { AnimatedSection } from "@/components/crob/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

import {
  OverviewSection,
  BookingsSection,
  LogsSection,
  UsersSection,
  LockerStatusSection,
  KeyStatusSection,
} from "@/components/admin/AdminComponents";

export const Route = createFileRoute("/execom")({
  component: ExecomDashboard,
});

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "bookings", label: "Booking Requests", icon: Calendar },
  { id: "members", label: "Member List", icon: Users },
  { id: "execom", label: "ExeCom Members", icon: ShieldCheck },
  { id: "logs", label: "Member Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

function ExecomDashboard() {
  const { user, profile, role, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center flex-col gap-4">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-muted-foreground font-display tracking-wider animate-pulse">
          Loading C-ROB Smart Key Locker...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "execom") {
    if (role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/member" replace />;
  }

  const customSidebar = (
    <>
      <div className="px-5 mb-4 shrink-0">
        <h2 className="text-lg font-bold font-display text-primary/90 tracking-tight">
          ExeCom Dashboard
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          Executive committee operations and monitoring.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
        <nav className="space-y-1 px-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-primary/15 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground border-l-2 border-transparent"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto shrink-0  p-4 hidden md:block">
        <Card className="panel border-sidebar-border bg-card/60 glow-subtle">
          <CardContent className="p-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || "ExeCom Member"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-[10px] uppercase font-bold text-primary tracking-wider mt-0.5">
                    ExeCom Account
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
              >
                <LogOut className="size-3 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <AppShell customSidebar={customSidebar} hideMobileNav={true}>
      <div className="flex gap-2 overflow-x-auto border-b border-border/50 pb-2 mb-6 md:hidden custom-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground bg-card/40 border border-transparent"
              }`}
            >
              <Icon className="size-3 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatedSection className="flex flex-col gap-6">
        <main className="flex-1 min-w-0">
          {activeTab === "overview" && <OverviewSection />}
          {activeTab === "bookings" && <BookingsSection />}
          {activeTab === "members" && <UsersSection filterRole="member" title="Member List" />}
          {activeTab === "execom" && <UsersSection filterRole="execom" title="ExeCom Members" />}
          {activeTab === "logs" && <LogsSection />}

          {activeTab === "settings" && (
            <Card className="panel border-primary/30 fade-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Settings className="size-5" /> Preferences
                </CardTitle>
                <CardDescription>View account preferences and session details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">
                  Settings are currently managed via the Supabase Dashboard. Role updates and
                  physical overrides require direct database access.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </AnimatedSection>
    </AppShell>
  );
}
