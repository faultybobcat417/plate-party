import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useDeepLink() {
  const { refreshSession } = useAuth();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (url.includes("auth/callback") || url.includes("type=signup") || url.includes("type=magiclink")) {
        // Extract tokens from URL if present
        const parsed = Linking.parse(url);
        if (parsed.queryParams?.access_token) {
          const { access_token, refresh_token } = parsed.queryParams;
          await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: (refresh_token as string) || "",
          });
          await refreshSession();
        }
      }
    };

    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Handle URL changes
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [refreshSession]);
}
