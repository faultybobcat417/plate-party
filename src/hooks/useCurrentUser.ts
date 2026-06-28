import { useAuth } from "../context/AuthContext";
import { useUserStore } from "../stores/useUserStore";
import { useEffect } from "react";

export function useCurrentUser() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, fetchProfile } = useUserStore();
  const isAnonymous = user?.app_metadata?.provider === "anonymous" || user?.is_anonymous === true;

  useEffect(() => {
    if (user?.id && !isAnonymous && !profile) fetchProfile(user.id);
  }, [user?.id, isAnonymous, profile, fetchProfile]);

  return {
    userId: user?.id ?? null,
    profile: isAnonymous ? null : profile,
    isAuthenticated: !!user,
    isAnonymous,
    loading: authLoading || (!isAnonymous && profileLoading),
    refreshProfile: () => { if (user?.id && !isAnonymous) fetchProfile(user.id); },
  };
}
