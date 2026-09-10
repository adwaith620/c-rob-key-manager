import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldX, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CrobBackground, CrobLogo, GradientText } from "@/components/crob";

export const Route = createFileRoute("/access-denied")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Access Denied — C-ROB Smart Key Locker" },
      {
        name: "description",
        content: "This portal is exclusively for C-ROB members of TKMCE.",
      },
    ],
  }),
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <CrobBackground variant="auth" />

      <div className="relative z-10 w-full max-w-md text-center animate-fade-up">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <CrobLogo size="sm" />
        </div>

        {/* Error Icon */}
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/20 to-destructive/5">
          <ShieldX className="size-10 text-destructive" />
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <GradientText>TKMCE</GradientText> account required
        </h1>

        {/* Body */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This portal is exclusively for C-ROB members of TKM College of Engineering.
        </p>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Please sign in using your official TKMCE account.
        </p>

        {/* CTA */}
        <Button asChild className="glow mt-8 w-full h-12 text-base" variant="default">
          <Link to="/login">
            <ArrowLeft className="mr-2 size-4" />
            Return to Login
          </Link>
        </Button>

        {/* Subtle hint */}
        <p className="mt-5 text-xs text-muted-foreground/60">
          If you selected the wrong Google account, click the button above and try again with your
          @tkmce.ac.in account.
        </p>
      </div>
    </div>
  );
}
