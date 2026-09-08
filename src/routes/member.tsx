import { createFileRoute, Navigate } from "@tanstack/react-router";

import { AppShell, PageHeading } from "@/components/AppShell";
import { BookingForm } from "@/components/bookings/BookingForm";
import { BookingList } from "@/components/bookings/BookingList";
import { CurrentSession } from "@/components/bookings/CurrentSession";
import { GlobalKeyStatus } from "@/components/GlobalKeyStatus";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/member")({
  component: MemberDashboard,
});

function MemberDashboard() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          Loading dashboard...
        </div>
      </AppShell>
    );
  }

  // Basic route protection
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <PageHeading
        title={`Welcome, ${profile?.full_name?.split(" ")[0] || "Member"}`}
        subtitle="Manage your key access and view session history."
        right={<GlobalKeyStatus />}
      />

      <div className="mb-8">
        <CurrentSession />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <BookingForm />
        </div>
        <div>
          <BookingList />
        </div>
      </div>
    </AppShell>
  );
}
