import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_ANONYMOUS_USER_ID = "00000000-0000-4000-8000-000000000001";

function createLocalAnonymousUser(): User {
  const now = new Date().toISOString();
  return {
    id: LOCAL_ANONYMOUS_USER_ID,
    aud: "authenticated",
    role: "anonymous",
    app_metadata: {
      provider: "anonymous",
      providers: ["anonymous"],
    },
    user_metadata: {},
    created_at: now,
    updated_at: now,
    is_anonymous: true,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (currentSession) {
          if (!mounted) return;
          setSession(currentSession);
          setUser(currentSession.user);
          return;
        }

        const { data, error: anonymousError } = await supabase.auth.signInAnonymously();
        if (anonymousError) throw anonymousError;
        if (!mounted) return;
        setSession(data.session);
        setUser(data.user ?? data.session?.user ?? null);
      } catch (error) {
        console.warn("[Auth] Anonymous bootstrap failed.", error);
        if (!mounted) return;
        setSession(null);
        setUser(createLocalAnonymousUser());
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void bootstrapAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? createLocalAnonymousUser());
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? createLocalAnonymousUser());
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "plateparty://auth/callback" },
    });
    if (error) throw error;
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refreshSession();
  }, [refreshSession]);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    await refreshSession();
  }, [refreshSession]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "plateparty://auth/callback",
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
  }, []);

  const signInAsGuest = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        return;
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      setSession(data.session);
      setUser(data.user ?? data.session?.user ?? createLocalAnonymousUser());
    } catch (error) {
      console.warn("[Auth] Guest sign-in fell back to local anonymous mode.", error);
      setSession(null);
      setUser(createLocalAnonymousUser());
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: "plateparty://auth/callback",
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await signInAsGuest();
  }, [signInAsGuest]);

  return (
    <AuthContext.Provider value={{
      session, user, loading,
      signInWithEmail, signInWithPassword, signUpWithPassword, signInWithGoogle, signInWithApple, signInAsGuest,
      signOut, refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
