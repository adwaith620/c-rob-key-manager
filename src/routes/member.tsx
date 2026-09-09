import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell, PageHeading } from "@/components/AppShell";
import { BookingForm } from "@/components/bookings/BookingForm";
import { BookingList } from "@/components/bookings/BookingList";
import { CurrentSession } from "@/components/bookings/CurrentSession";
import { DailySchedule } from "@/components/bookings/DailySchedule";
import { GlobalKeyStatus } from "@/components/GlobalKeyStatus";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/member")({
  ssr: false,
  component: MemberDashboard,
});

function MemberDashboard() {
  const { user, profile, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if the URL hash contains an OAuth error from Supabase
    // (e.g. the Postgres trigger rejected a non-@tkmce.ac.in email)
    const hash = window.location.hash;
    if (hash && hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get("error_description");
      if (errorDesc) {
        setAuthError(decodeURIComponent(errorDesc).replace(/\+/g, " "));
        // Clean the URL hash so it doesn't persist on refresh
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    setChecking(false);
  }, []);

  // If Supabase returned an OAuth error (non-TKMCE email rejected by DB trigger),
  // sign out any partial session and redirect to the access-denied page.
  useEffect(() => {
    if (authError && supabase) {
      supabase.auth.signOut();
    }
  }, [authError]);

  if (authError) {
    return <Navigate to="/access-denied" replace />;
  }

  if (loading || checking) {
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
        <div className="space-y-8">
          <BookingForm />
          <DailySchedule />
        </div>
        <div>
          <BookingList />
        </div>
      </div>
    </AppShell>
  );
}
