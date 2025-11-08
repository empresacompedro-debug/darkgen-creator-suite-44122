import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  isActive: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  subscription: any | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isPremium: false,
    isAdmin: false,
    subscription: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setStatus({
        isActive: false,
        isPremium: false,
        isAdmin: false,
        subscription: null,
        loading: false,
      });
      return;
    }

    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-status');

      if (error) {
        console.error('Error checking subscription:', error);
        setStatus((prev) => ({ ...prev, loading: false }));
        return;
      }

      setStatus({
        isActive: data.isActive || false,
        isPremium: data.isPremium || false,
        isAdmin: data.isAdmin || false,
        subscription: data.subscription,
        loading: false,
      });
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  return { ...status, refetch: checkSubscription };
};
