import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { friendlyAuthError, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login — C-ROB Smart Key Locker" },
      {
        name: "description",
        content: "Sign in to book the C-ROB lab key and view your locker sessions.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Handle OAuth redirect errors (e.g. from our Postgres trigger rejecting non-college emails)
    const hash = window.location.hash;
    if (hash && hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get("error_description");
      if (errorDesc) {
        setError(friendlyAuthError(decodeURIComponent(errorDesc).replace(/\+/g, " ")));
        // Clean the URL hash so it doesn't persist on refresh
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, []);

  async function onGoogleSignIn() {
    setError(null);
    if (!supabase) {
      setError("Sign-in is not available until the Supabase project is connected.");
      return;
    }
    setBusy(true);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/member",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (signInError) {
      setBusy(false);
      setError(friendlyAuthError(signInError.message));
    }
    // Note: If successful, the page redirects to Google, so we don't clear 'busy' here.
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your C-ROB account."
      footer={
        <>
          Need an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          variant="crobSecondary"
          className="w-full h-12 rounded-xl"
          onClick={onGoogleSignIn}
          disabled={busy}
        >
          <svg className="mr-2 h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
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
          {busy ? "Connecting..." : "Sign in with Google"}
        </Button>

        <div className="text-center text-xs text-muted-foreground mt-4">
          Registration is strictly limited to <strong>@tkmce.ac.in</strong> email addresses.
        </div>
      </div>
    </AuthLayout>
  );
}
