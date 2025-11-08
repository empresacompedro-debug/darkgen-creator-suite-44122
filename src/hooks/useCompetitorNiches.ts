import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompetitorNiche {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useCompetitorNiches() {
  const [niches, setNiches] = useState<CompetitorNiche[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadNiches = async () => {
    try {
      const { data, error } = await supabase
        .from('competitor_niches')
        .select('*')
        .order('name');

      if (error) throw error;
      setNiches(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar nichos:', error);
      toast({
        title: "Erro ao carregar nichos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNiche = async (name: string, description?: string, color?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('competitor_niches')
        .insert([
          {
            user_id: user.id,
            name,
            description: description || null,
            color: color || '#3b82f6'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Nicho criado",
        description: `O nicho "${name}" foi criado com sucesso.`
      });

      await loadNiches();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar nicho:', error);
      toast({
        title: "Erro ao criar nicho",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateNiche = async (id: string, updates: Partial<CompetitorNiche>) => {
    try {
      const { error } = await supabase
        .from('competitor_niches')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Nicho atualizado",
        description: "As alterações foram salvas com sucesso."
      });

      await loadNiches();
    } catch (error: any) {
      console.error('Erro ao atualizar nicho:', error);
      toast({
        title: "Erro ao atualizar nicho",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteNiche = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competitor_niches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Nicho removido",
        description: "O nicho foi removido com sucesso. Os concorrentes foram mantidos."
      });

      await loadNiches();
    } catch (error: any) {
      console.error('Erro ao deletar nicho:', error);
      toast({
        title: "Erro ao deletar nicho",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const moveCompetitorToNiche = async (competitorId: string, nicheId: string | null) => {
    try {
      const { error } = await supabase
        .from('competitor_monitors')
        .update({ niche_id: nicheId })
        .eq('id', competitorId);

      if (error) throw error;

      toast({
        title: "Concorrente movido",
        description: "O concorrente foi movido para o nicho selecionado."
      });
    } catch (error: any) {
      console.error('Erro ao mover concorrente:', error);
      toast({
        title: "Erro ao mover concorrente",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const bulkAssignNiche = async (competitorIds: string[], nicheId: string) => {
    try {
      const { error } = await supabase
        .from('competitor_monitors')
        .update({ niche_id: nicheId })
        .in('id', competitorIds);

      if (error) throw error;

      toast({
        title: "Concorrentes atribuídos",
        description: `${competitorIds.length} concorrente(s) foram atribuídos ao nicho.`
      });
    } catch (error: any) {
      console.error('Erro ao atribuir em lote:', error);
      toast({
        title: "Erro ao atribuir concorrentes",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    loadNiches();
  }, []);

  return {
    niches,
    loading,
    loadNiches,
    createNiche,
    updateNiche,
    deleteNiche,
    moveCompetitorToNiche,
    bulkAssignNiche
  };
}
