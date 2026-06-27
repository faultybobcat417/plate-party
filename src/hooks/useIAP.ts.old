import { useState, useEffect, useCallback } from "react";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import {
  initializeRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  PLATE_PRODUCT_ID,
} from "../lib/revenuecat";
import { supabase } from "../lib/supabase";

interface IAPState {
  package: PurchasesPackage | null;
  loading: boolean;
  purchasing: boolean;
  error: string | null;
  platesToAdd: number;
}

export function useIAP() {
  const [state, setState] = useState<IAPState>({
    package: null,
    loading: true,
    purchasing: false,
    error: null,
    platesToAdd: 10,
  });

  useEffect(() => {
    let mounted = true;
    initializeRevenueCat().then(async () => {
      const pkg = await getOfferings();
      if (mounted) {
        setState((s) => ({ ...s, package: pkg, loading: false }));
      }
    });
    return () => { mounted = false; };
  }, []);

  const buyPlates = useCallback(async (): Promise<boolean> => {
    if (!state.package) {
      setState((s) => ({ ...s, error: "No product available." }));
      return false;
    }

    setState((s) => ({ ...s, purchasing: true, error: null }));
    try {
      const result = await purchasePackage(state.package);
      if (!result.success || !result.transactionId) {
        setState((s) => ({ ...s, purchasing: false, error: result.error || "Purchase failed." }));
        return false;
      }

      // Validate server-side via Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState((s) => ({ ...s, purchasing: false, error: "Not authenticated." }));
        return false;
      }

      const { data, error } = await supabase.functions.invoke("validate-purchase", {
        body: {
          transactionId: result.transactionId,
          productId: PLATE_PRODUCT_ID,
          userId: session.user.id,
        },
      });

      if (error || !data?.success) {
        setState((s) => ({ ...s, purchasing: false, error: data?.error || "Validation failed." }));
        return false;
      }

      setState((s) => ({ ...s, purchasing: false }));
      return true;
    } catch (err: any) {
      setState((s) => ({ ...s, purchasing: false, error: err.message || "Purchase error." }));
      return false;
    }
  }, [state.package]);

  const restore = useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const hasRestored = await restorePurchases();
      setState((s) => ({ ...s, loading: false }));
      return hasRestored;
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      return false;
    }
  }, []);

  return {
    ...state,
    buyPlates,
    restore,
  };
}
