import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldX, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <div className="grid-lines flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
          <ShieldX className="size-8 text-destructive" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight">Oops! TKMCE account required</h1>

        {/* Body */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          This portal is exclusively for C-ROB members of TKMCE.
        </p>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Please sign in using your official TKMCE email ID ending with{" "}
          <strong className="text-foreground">@tkmce.ac.in</strong>.
        </p>

        {/* CTA */}
        <Button asChild className="mt-8 w-full h-11" variant="default">
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
