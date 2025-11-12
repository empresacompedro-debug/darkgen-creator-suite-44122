import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatus {
  isActive: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  subscription: any | null;
  loading: boolean;
}

// ✅ Cache local (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;
let cachedStatus: SubscriptionStatus | null = null;
let cacheTimestamp = 0;

export const useSubscription = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isPremium: false,
    isAdmin: false,
    subscription: null,
    loading: true,
  });
  
  // ✅ Debounce para evitar múltiplas chamadas
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setStatus({
        isActive: false,
        isPremium: false,
        isAdmin: false,
        subscription: null,
        loading: false,
      });
      cachedStatus = null;
      cacheTimestamp = 0;
      return;
    }

    // ✅ Usar cache se disponível e válido
    const now = Date.now();
    if (cachedStatus && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('🔄 [useSubscription] Usando cache local');
      setStatus(cachedStatus);
      return;
    }

    // ✅ Debounce: aguardar 300ms antes de fazer request
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(() => {
      checkSubscription();
    }, 300);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [user]);

  const checkSubscription = async () => {
    // ✅ Prevenir múltiplas chamadas simultâneas
    if (isCheckingRef.current) {
      console.log('⏳ [useSubscription] Verificação já em andamento, ignorando');
      return;
    }

    isCheckingRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-status');

      if (error) {
        console.error('❌ [useSubscription] Error checking subscription:', error);
        
        // ✅ Não entrar em loop infinito em caso de erro 405
        if (error.message?.includes('405')) {
          console.error('⚠️ [useSubscription] Erro 405 detectado - parando verificações');
          setStatus((prev) => ({ ...prev, loading: false }));
          isCheckingRef.current = false;
          return;
        }
        
        setStatus((prev) => ({ ...prev, loading: false }));
        isCheckingRef.current = false;
        return;
      }

      const newStatus = {
        isActive: data.isActive || false,
        isPremium: data.isPremium || false,
        isAdmin: data.isAdmin || false,
        subscription: data.subscription,
        loading: false,
      };

      // ✅ Atualizar cache
      cachedStatus = newStatus;
      cacheTimestamp = Date.now();
      
      setStatus(newStatus);
      console.log('✅ [useSubscription] Status atualizado e cacheado');
    } catch (error) {
      console.error('❌ [useSubscription] Error in checkSubscription:', error);
      setStatus((prev) => ({ ...prev, loading: false }));
    } finally {
      isCheckingRef.current = false;
    }
  };

  return { ...status, refetch: checkSubscription };
};
