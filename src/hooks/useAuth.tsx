import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type Role = "member" | "execom" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role;
  configured: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // loading indicates if the initial session AND profile fetch are still in progress
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    let mounted = true;

    async function initializeAuth() {
      // 1. Get the current session
      const {
        data: { session: initialSession },
      } = await client.auth.getSession();

      if (!mounted) return;
      setSession(initialSession);

      // 2. If a session exists, explicitly fetch the profile before ending the loading state
      if (initialSession?.user?.id) {
        const { data: profileData } = await client
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("id", initialSession.user.id)
          .maybeSingle();

        if (!mounted) return;
        setProfile((profileData as Profile | null) ?? null);
      } else {
        if (mounted) setProfile(null);
      }

      if (mounted) setLoading(false);
    }

    initializeAuth();

    // Listen for ongoing auth state changes
    const { data: sub } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      // If session user changes
      setSession(nextSession);
      if (nextSession?.user?.id) {
        // Fetch profile silently in the background
        const { data: profileData } = await client
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("id", nextSession.user.id)
          .maybeSingle();

        if (mounted) setProfile((profileData as Profile | null) ?? null);
      } else {
        if (mounted) setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? "member",
      configured: isSupabaseConfigured,
      signOut: async () => {
        await supabase?.auth.signOut();
        setProfile(null);
      },
    }),
    [loading, session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const roleLabel: Record<Role, string> = {
  member: "Member",
  execom: "Execom",
  admin: "Admin",
};
