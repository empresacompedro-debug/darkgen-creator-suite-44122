import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FilterOptions {
  minVPH: number;
  minViewsPerSubscriber: number;
  minAvgViews: number;
  uploadsPerMonthMin: number;
  uploadsPerMonthMax: number;
  lastUploadDays: number;
  minDataQuality: number;
  videoCountMin: number;
  videoCountMax: number;
  channelAgeDaysMin: number;
  channelAgeDaysMax: number;
  subscribersMin: number;
  subscribersMax: number;
  totalViewsMin: number;
  totalViewsMax: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterOptions;
  icon: string;
  is_default?: boolean;
}

export const useFilterPresets = () => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadPresets = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedPresets: FilterPreset[] = (data || []).map((preset) => ({
        id: preset.id,
        name: preset.name,
        filters: preset.filters as unknown as FilterOptions,
        icon: preset.icon,
        is_default: preset.is_default,
      }));
      
      setPresets(typedPresets);
    } catch (error: any) {
      console.error('Error loading presets:', error);
      toast({
        title: "Erro ao carregar presets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreset = async (name: string, filters: FilterOptions, icon: string = '🎯') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('filter_presets')
        .insert([{
          user_id: user.id,
          name,
          filters: filters as any,
          icon,
        }]);

      if (error) throw error;

      toast({
        title: "✅ Preset Salvo",
        description: `"${name}" foi salvo com sucesso`,
      });

      await loadPresets();
    } catch (error: any) {
      console.error('Error saving preset:', error);
      toast({
        title: "Erro ao salvar preset",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePreset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('filter_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "✅ Preset Excluído",
        description: "Preset removido com sucesso",
      });

      await loadPresets();
    } catch (error: any) {
      console.error('Error deleting preset:', error);
      toast({
        title: "Erro ao excluir preset",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePreset = async (id: string, updates: Partial<FilterPreset>) => {
    try {
      const updateData: any = { ...updates };
      if (updateData.filters) {
        updateData.filters = updateData.filters as any;
      }
      
      const { error } = await supabase
        .from('filter_presets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "✅ Preset Atualizado",
        description: "Preset atualizado com sucesso",
      });

      await loadPresets();
    } catch (error: any) {
      console.error('Error updating preset:', error);
      toast({
        title: "Erro ao atualizar preset",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadPresets();
  }, [user]);

  return {
    presets,
    isLoading,
    loadPresets,
    savePreset,
    deletePreset,
    updatePreset,
  };
};
