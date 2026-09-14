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
  const { user, profile, loading, role } = useAuth();
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

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "execom") {
    return <Navigate to="/execom" replace />;
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
