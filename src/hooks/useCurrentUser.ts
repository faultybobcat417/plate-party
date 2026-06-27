import { useAuth } from "../context/AuthContext";
import { useUserStore } from "../stores/useUserStore";
import { useEffect } from "react";

export function useCurrentUser() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, fetchProfile } = useUserStore();

  useEffect(() => {
    if (user?.id && !profile) fetchProfile(user.id);
  }, [user?.id, profile, fetchProfile]);

  return {
    userId: user?.id ?? null,
    profile,
    isAuthenticated: !!user,
    isAnonymous: user?.app_metadata?.provider === "anonymous",
    loading: authLoading || profileLoading,
    refreshProfile: () => { if (user?.id) fetchProfile(user.id); },
  };
}
