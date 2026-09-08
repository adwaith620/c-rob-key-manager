import { Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import type { ReactNode } from "react";

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
    <div className="grid-lines flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <KeyRound className="size-5" />
          </span>
          <span className="font-display text-sm leading-tight">
            C-ROB
            <span className="block text-[10px] tracking-[0.22em] text-muted-foreground">
              SMART KEY LOCKER
            </span>
          </span>
        </Link>

        <div className="panel glow p-6">
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          {!isSupabaseConfigured ? (
            <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
              Sign-in is not connected yet. Connect your Supabase project to enable accounts.
            </p>
          ) : null}
          <div className="mt-5">{children}</div>
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
