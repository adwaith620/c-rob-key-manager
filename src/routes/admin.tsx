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
} from "@/components/admin/AdminComponents";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "lockers", label: "Lockers", icon: Box },
  { id: "keys", label: "Keys", icon: Key },
  { id: "members", label: "Members", icon: Users },
  { id: "execom", label: "ExeCom", icon: ShieldCheck },
  { id: "fingerprints", label: "Fingerprint", icon: Fingerprint },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) return null;

  if (!user || role !== "admin") {
    return <Navigate to="/member" replace />;
  }

  return (
    <AppShell>
      <PageHeading title="Admin Dashboard" subtitle="System administration and oversight." />

      <AnimatedSection className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "bg-primary/20 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-card/40 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 hidden md:block">
            <Card className="panel bg-card/30">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Admin Account</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="w-full mt-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="size-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {activeTab === "overview" && <OverviewSection />}
          {activeTab === "bookings" && <BookingsSection />}
          {activeTab === "members" && <UsersSection />}
          {activeTab === "logs" && <LogsSection />}

          {["lockers", "keys", "execom", "fingerprints"].includes(activeTab) && (
            <Card className="panel border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted/20 p-4 mb-4">
                  <Activity className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No data available</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Official {activeTab} data has not been added or integrated with the backend yet.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="panel border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="size-5" /> Danger Zone
                </CardTitle>
                <CardDescription>Advanced system settings</CardDescription>
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
