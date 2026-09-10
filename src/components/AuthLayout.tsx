import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { CrobBackground, CrobLogo } from "@/components/crob";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <CrobBackground variant="auth" />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <CrobLogo size="md" />
        </Link>

        <div className="panel glow relative overflow-hidden rounded-2xl p-6">
          {/* Gradient border accent along the top */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, oklch(0.62 0.19 258) 30%, oklch(0.75 0.14 205) 70%, transparent)",
            }}
            aria-hidden="true"
          />

          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          {!isSupabaseConfigured ? (
            <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
              Sign-in is not connected yet. Connect your Supabase project to enable accounts.
            </p>
          ) : null}
          <div className="mt-5">{children}</div>
        </div>

        {footer ? (
          <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
