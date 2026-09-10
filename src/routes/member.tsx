import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AnimatedSection, GradientText } from "@/components/crob";
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
    const hash = window.location.hash;
    if (hash && hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get("error_description");
      if (errorDesc) {
        setAuthError(decodeURIComponent(errorDesc).replace(/\+/g, " "));
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    setChecking(false);
  }, []);

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
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <PageHeading
        title={
          <>
            Welcome, <GradientText>{profile?.full_name?.split(" ")[0] || "Member"}</GradientText>
          </>
        }
        subtitle="Manage your key access and view session history."
        right={<GlobalKeyStatus />}
      />

      <AnimatedSection animation="fade-in" delay={100} className="mb-8">
        <CurrentSession />
      </AnimatedSection>

      <div className="grid gap-8 lg:grid-cols-2">
        <AnimatedSection animation="fade-in" delay={200} className="space-y-8">
          <BookingForm />
          <DailySchedule />
        </AnimatedSection>
        <AnimatedSection animation="fade-in" delay={300}>
          <BookingList />
        </AnimatedSection>
      </div>
    </AppShell>
  );
}
