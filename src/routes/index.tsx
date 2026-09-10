import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Fingerprint, KeyRound, Radar, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AnimatedSection,
  CrobBackground,
  CrobCard,
  CrobLogo,
  CrobRobot,
  GradientText,
} from "@/components/crob";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "C-ROB Smart Key Locker — TKMCE Centre for Robotics" },
      {
        name: "description",
        content:
          "Book time slots for the C-ROB lab key, unlock the smart locker with an OTP or fingerprint, and track key custody in real time.",
      },
      { property: "og:title", content: "C-ROB Smart Key Locker" },
      {
        property: "og:description",
        content: "Role-based booking and access control for the C-ROB lab key at TKMCE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: CalendarClock,
    title: "1. Book a slot",
    body: "Pick a future date, time and a duration of 1 to 5 hours from your member dashboard.",
    iconColor: "bg-primary/20 text-primary",
  },
  {
    icon: Smartphone,
    title: "2. Get your OTP",
    body: "Once approved, a one-time code is issued for the locker keypad, valid for your slot only.",
    iconColor: "bg-accent/20 text-accent",
  },
  {
    icon: KeyRound,
    title: "3. Take the key",
    body: "Enter the OTP on the keypad. The locker opens and your session timer starts.",
    iconColor: "bg-primary/20 text-primary",
  },
  {
    icon: Radar,
    title: "4. Return & confirm",
    body: "A Hall Effect sensor detects the key back inside and closes the session automatically.",
    iconColor: "bg-accent/20 text-accent",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <CrobBackground variant="hero" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <CrobLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative border-b border-border/50">
        <div className="relative z-10 mx-auto flex max-w-6xl items-center gap-12 px-5 py-28 md:py-36">
          {/* Left — text content */}
          <div className="flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-primary">
              🤖 C-ROB Smart Key Locker
            </span>

            <h1 className="mt-7 max-w-2xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              The lab key, <GradientText>under control</GradientText>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              C-ROB Smart Key Locker replaces the sign-out register with a hardware locker and a
              booking system. Members reserve a slot and unlock with an OTP; Execom members use
              fingerprint access. Every handover is logged.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="crobSecondary">
                <Link to="/register">
                  <svg
                    className="mr-2 h-4 w-4 bg-white rounded-full"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Continue with Google
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Member Login</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Access is strictly restricted to @tkmce.ac.in accounts.
            </p>
          </div>

          {/* Right — robot illustration (hidden on mobile) */}
          <div className="hidden md:block">
            <CrobRobot size="lg" />
          </div>
        </div>
      </section>

      {/* ── How Booking Works ── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <AnimatedSection>
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            How <GradientText>booking</GradientText> works
          </h2>
        </AnimatedSection>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, body, iconColor }, i) => (
            <AnimatedSection key={title} delay={i * 100}>
              <CrobCard
                icon={<Icon className="size-6" />}
                iconColor={iconColor}
                title={title}
                description={body}
              />
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── Two Levels of Access ── */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <AnimatedSection>
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Two levels of <GradientText>access</GradientText>
          </h2>
        </AnimatedSection>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <AnimatedSection delay={0}>
            <CrobCard
              icon={<Smartphone className="size-6" />}
              iconColor="bg-primary/20 text-primary"
              title="Members"
            >
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Any registered student with a college email. Members book slots in advance, receive
                an OTP for the keypad, and are responsible for returning the key before their
                deadline.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Slot booking with 1–5 hour durations</li>
                <li>• OTP-based locker access</li>
                <li>• Return reminders and session history</li>
              </ul>
            </CrobCard>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <CrobCard
              icon={<Fingerprint className="size-6" />}
              iconColor="bg-accent/20 text-accent"
              title="Execom"
              featured
            >
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Student leadership and staff. Execom members authenticate directly on the locker
                with fingerprint, approve extension requests, and can take over an active session.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Fingerprint access, no booking required</li>
                <li>• Approve or reject extensions</li>
                <li>• Live view of who holds the key</li>
              </ul>
            </CrobCard>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-10">
        <div className="flex flex-col items-center gap-3">
          <CrobLogo size="xs" showSubtext={false} />
          <p className="text-xs text-muted-foreground">
            C-ROB · TKMCE Centre for Robotics · Smart Key Locker
          </p>
        </div>
      </footer>
    </div>
  );
}
