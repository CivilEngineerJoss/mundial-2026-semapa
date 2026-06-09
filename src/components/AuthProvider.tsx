import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { UserProfile } from "../lib/types";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(() => (
    window.location.search.includes("reset-password=1") ||
    window.location.hash.includes("type=recovery")
  ));

  const loadProfile = async (userId?: string) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
    setProfile((data as UserProfile | null) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      setSession(nextSession);
      loadProfile(nextSession?.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      passwordRecovery,
      clearPasswordRecovery: () => setPasswordRecovery(false),
      refreshProfile: () => loadProfile(session?.user.id),
    }),
    [session, profile, loading, passwordRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
