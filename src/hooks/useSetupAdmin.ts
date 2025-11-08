import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSetupAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const setupAdmin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-first-admin', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Admin configurado com sucesso!",
          description: "Você agora tem acesso total ao sistema.",
        });
        
        // Reload to refresh permissions
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
        return true;
      } else {
        toast({
          title: "Aviso",
          description: data.message,
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: "Erro ao configurar admin",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { setupAdmin, isLoading };
};
