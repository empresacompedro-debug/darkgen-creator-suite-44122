import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Save, Trash2, CheckCircle, Loader2, AlertCircle, Plus, X, Shield, Upload, CheckCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useSetupAdmin } from "@/hooks/useSetupAdmin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  key: string;
  is_active: boolean;
  priority: number;
  is_current: boolean;
  last_used_at?: string;
}

interface VertexApiKey extends ApiKey {
  projectId?: string;
  location?: string;
  jsonFile?: File;
}

const Configuracoes = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [youtubeKeys, setYoutubeKeys] = useState<ApiKey[]>([]);
  const [geminiKeys, setGeminiKeys] = useState<ApiKey[]>([]);
  const [vertexKeys, setVertexKeys] = useState<VertexApiKey[]>([]);
  const [claudeKeys, setClaudeKeys] = useState<ApiKey[]>([]);
  const [openaiKeys, setOpenaiKeys] = useState<ApiKey[]>([]);
  const [huggingfaceKeys, setHuggingfaceKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const { setupAdmin, isLoading: isSettingUpAdmin } = useSetupAdmin();
  const [validatingKey, setValidatingKey] = useState<string | null>(null);
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportProvider, setBulkImportProvider] = useState<string>("");
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [validatingKeys, setValidatingKeys] = useState(false);
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 });
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    loadUserData();
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setHasAdminRole(!!roles);
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadApiKeys(user.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiKeys = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true });

      if (error) throw error;

      const groupedKeys = {
        youtube: [] as ApiKey[],
        gemini: [] as ApiKey[],
        'vertex-ai': [] as VertexApiKey[],
        claude: [] as ApiKey[],
        openai: [] as ApiKey[],
        huggingface: [] as ApiKey[]
      };

      data?.forEach((key: any) => {
        const apiKey: ApiKey | VertexApiKey = {
          id: key.id,
          key: '••••••••••••••••', // Don't show encrypted key, just placeholder
          is_active: key.is_active,
          priority: key.priority || 1,
          is_current: key.is_current || false,
          last_used_at: key.last_used_at,
          ...(key.api_provider === 'vertex-ai' && key.vertex_config ? {
            projectId: key.vertex_config.project_id,
            location: key.vertex_config.location
          } : {})
        };

        if (key.api_provider in groupedKeys) {
          groupedKeys[key.api_provider as keyof typeof groupedKeys].push(apiKey as any);
        }
      });

      setYoutubeKeys(groupedKeys.youtube);
      setGeminiKeys(groupedKeys.gemini);
      setVertexKeys(groupedKeys['vertex-ai']);
      setClaudeKeys(groupedKeys.claude);
      setOpenaiKeys(groupedKeys.openai);
      setHuggingfaceKeys(groupedKeys.huggingface);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
    }
  };

  const loadApiKeysForProvider = async (userId: string, provider: string) => {
    try {
      console.log(`🔄 [LoadKeys] Recarregando apenas ${provider}...`);
      
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('api_provider', provider)
        .order('priority', { ascending: true });

      if (error) throw error;

      const keys: ApiKey[] = data?.map((key: any) => ({
        id: key.id,
        key: '••••••••••••••••',
        is_active: key.is_active,
        priority: key.priority || 1,
        is_current: key.is_current || false,
        last_used_at: key.last_used_at
      })) || [];

      // Atualizar APENAS o provider específico (evita race condition)
      const setters = {
        youtube: setYoutubeKeys,
        gemini: setGeminiKeys,
        'vertex-ai': setVertexKeys,
        claude: setClaudeKeys,
        openai: setOpenaiKeys,
        huggingface: setHuggingfaceKeys
      };
      
      setters[provider as keyof typeof setters]?.(keys);
      console.log(`✅ [LoadKeys] ${provider} recarregado: ${keys.length} chave(s)`);
    } catch (error: any) {
      console.error(`❌ [LoadKeys] Erro ao recarregar ${provider}:`, error);
    }
  };

  const handleSave = async (provider: string, keys: (ApiKey | VertexApiKey)[]) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    const PLACEHOLDER = '••••••••••••••••';
    setSavingProvider(provider);
    setSaveProgress({ current: 0, total: 0 });

    try {
      // Separar o que é atualização (chaves já existentes) do que é inserção (novas chaves)
      const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const existingToUpdate = keys.filter((k) => isUUID(k.id) && k.key === PLACEHOLDER);
      const newToInsert = keys.filter((k) => !isUUID(k.id) && k.key.trim() && k.key !== PLACEHOLDER);

      console.log(`📊 [HandleSave] Iniciando salvamento para ${provider}`, {
        provider,
        totalKeys: keys.length,
        existingToUpdate: existingToUpdate.length,
        newToInsert: newToInsert.length
      });

      // 1) Atualizar prioridades das chaves existentes (sem sobrescrever o valor da key)
      if (existingToUpdate.length > 0) {
        console.log(`🔄 [HandleSave] Atualizando ${existingToUpdate.length} prioridades...`);
        for (let i = 0; i < existingToUpdate.length; i++) {
          const k = existingToUpdate[i];
          const updateData: any = { priority: k.priority, updated_at: new Date().toISOString() };
          
          // Se for Vertex AI, também atualizar vertex_config
          if (provider === 'vertex-ai' && 'projectId' in k && k.projectId) {
            updateData.vertex_config = {
              project_id: k.projectId,
              location: (k as VertexApiKey).location || 'us-central1'
            };
          }
          
          const { error: updateError } = await supabase
            .from('user_api_keys')
            .update(updateData)
            .eq('id', k.id);
          if (updateError) {
            console.error('❌ Erro ao atualizar prioridade:', updateError);
            throw new Error(`Erro ao atualizar prioridade da chave ${i + 1}: ${updateError.message}`);
          }
        }
        console.log(`✅ [HandleSave] Prioridades atualizadas`);
      }

      // 2) Batch Insert: Preparar TODAS as chaves primeiro
      if (newToInsert.length > 0) {
        setSaveProgress({ current: 0, total: newToInsert.length });
        console.log(`🔐 [HandleSave] Criptografando ${newToInsert.length} chave(s)...`);
        
        const preparedKeys = [];
        for (let i = 0; i < newToInsert.length; i++) {
          const k = newToInsert[i];
          setSaveProgress({ current: i + 1, total: newToInsert.length });
          console.log(`🔑 Criptografando chave ${i + 1}/${newToInsert.length}...`);
          
          const { data: encryptedKey, error: encryptError } = await supabase
            .rpc('encrypt_api_key', { p_key: k.key.trim(), p_user_id: user.id });
          
          if (encryptError) {
            console.error('❌ Erro ao criptografar:', encryptError);
            throw new Error(`Erro ao criptografar chave ${i + 1}: ${encryptError.message}`);
          }
          
          const keyData: any = {
            user_id: user.id,
            api_provider: provider,
            api_key_encrypted: encryptedKey,
            is_active: true,
            priority: k.priority || 1,
            updated_at: new Date().toISOString(),
          };
          
          // Se for Vertex AI, adicionar vertex_config
          if (provider === 'vertex-ai' && 'projectId' in k && k.projectId) {
            keyData.vertex_config = {
              project_id: k.projectId,
              location: (k as VertexApiKey).location || 'us-central1'
            };
          }
          
          preparedKeys.push(keyData);
        }

        console.log(`✅ [HandleSave] Criptografia completa. Inserindo ${preparedKeys.length} chave(s) no banco (batch)...`);
        
        // Batch Insert: TODAS de uma vez (atômico)
        const { error: insertError } = await supabase
          .from('user_api_keys')
          .insert(preparedKeys);

        if (insertError) {
          console.error('❌ Erro ao inserir no banco:', insertError);
          
          // Tratar erro de duplicata
          if (insertError.code === '23505') {
            throw new Error('Uma ou mais chaves já existem no sistema. Remova duplicatas e tente novamente.');
          }
          
          throw new Error(`Erro ao inserir chaves: ${insertError.message}`);
        }
        
        console.log(`✅ [HandleSave] Inserção completa (${preparedKeys.length} chave(s))`);
      }

      // Recarregar APENAS o provider salvo (evita race condition)
      console.log(`🔄 [HandleSave] Recarregando ${provider}...`);
      await loadApiKeysForProvider(user.id, provider);
      
      const total = existingToUpdate.length + newToInsert.length;
      console.log(`✅ [HandleSave] Salvamento completo para ${provider}`, {
        provider,
        total,
        newInserted: newToInsert.length,
        prioritiesUpdated: existingToUpdate.length
      });
      
      toast({
        title: '✅ Salvo com Sucesso!',
        description: `${total} item(ns) processado(s). ${newToInsert.length} chave(s) adicionada(s) e ${existingToUpdate.length} prioridade(s) atualizada(s).`,
      });
    } catch (error: any) {
      console.error('❌ [HandleSave] Erro completo:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSavingProvider(null);
      setSaveProgress({ current: 0, total: 0 });
    }
  };
  const addKey = (provider: string) => {
    const newKey: ApiKey | VertexApiKey = provider === 'vertex-ai' 
      ? {
          id: `new-${Date.now()}`,
          key: '',
          is_active: true,
          priority: 1,
          is_current: false,
          projectId: '',
          location: 'us-central1'
        }
      : {
          id: `new-${Date.now()}`,
          key: '',
          is_active: true,
          priority: 1,
          is_current: false
        };

    switch(provider) {
      case 'youtube': setYoutubeKeys([...youtubeKeys, newKey]); break;
      case 'gemini': setGeminiKeys([...geminiKeys, newKey]); break;
      case 'vertex-ai': setVertexKeys([...vertexKeys, newKey as VertexApiKey]); break;
      case 'claude': setClaudeKeys([...claudeKeys, newKey]); break;
      case 'openai': setOpenaiKeys([...openaiKeys, newKey]); break;
      case 'huggingface': setHuggingfaceKeys([...huggingfaceKeys, newKey]); break;
    }
  };

  const removeKey = (provider: string, id: string) => {
    // If it's an existing key (UUID format), delete from database
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      supabase.from('user_api_keys').delete().eq('id', id).then(() => {
        loadApiKeys(user.id);
        toast({ title: "Removida", description: "API Key removida com sucesso" });
      });
    } else {
      // Just remove from local state if it's a new key not saved yet
      switch(provider) {
        case 'youtube': setYoutubeKeys(youtubeKeys.filter(k => k.id !== id)); break;
        case 'gemini': setGeminiKeys(geminiKeys.filter(k => k.id !== id)); break;
        case 'vertex-ai': setVertexKeys(vertexKeys.filter(k => k.id !== id)); break;
        case 'claude': setClaudeKeys(claudeKeys.filter(k => k.id !== id)); break;
        case 'openai': setOpenaiKeys(openaiKeys.filter(k => k.id !== id)); break;
        case 'huggingface': setHuggingfaceKeys(huggingfaceKeys.filter(k => k.id !== id)); break;
      }
    }
  };

  const updateKey = (provider: string, id: string, field: string, value: any) => {
    const updater = (keys: (ApiKey | VertexApiKey)[]) => keys.map(k => k.id === id ? { ...k, [field]: value } : k);
    
    switch(provider) {
      case 'youtube': setYoutubeKeys(updater(youtubeKeys)); break;
      case 'gemini': setGeminiKeys(updater(geminiKeys)); break;
      case 'vertex-ai': setVertexKeys(updater(vertexKeys) as VertexApiKey[]); break;
      case 'claude': setClaudeKeys(updater(claudeKeys)); break;
      case 'openai': setOpenaiKeys(updater(openaiKeys)); break;
      case 'huggingface': setHuggingfaceKeys(updater(huggingfaceKeys)); break;
    }
  };

  const validateKey = async (provider: string, keyId: string, keyValue: string) => {
    if (keyValue === '••••••••••••••••') {
      toast({ title: "Aviso", description: "Não é possível validar chaves já salvas", variant: "default" });
      return;
    }

    setValidatingKey(keyId);
    try {
      const { data, error } = await supabase.functions.invoke('test-api-key', {
        body: { provider, apiKey: keyValue }
      });

      if (error) throw error;

      if (data?.valid) {
        toast({ title: "✅ Chave válida!", description: data.message });
      } else {
        toast({ title: "❌ Chave inválida", description: data?.message || "Erro ao validar", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setValidatingKey(null);
    }
  };

  const validateVertexKey = async (keyId: string, serviceAccountJson: string, projectId: string, location: string) => {
    setValidatingKey(keyId);
    try {
      const { data, error } = await supabase.functions.invoke('test-vertex-api', {
        body: { serviceAccountJson, projectId, location }
      });

      if (error) throw error;

      if (data?.valid) {
        toast({ 
          title: "✅ Credenciais Vertex AI válidas!", 
          description: `${data.modelsCount || 0} modelos disponíveis`,
          duration: 5000
        });
        return true;
      } else {
        toast({ 
          title: "❌ Credenciais inválidas", 
          description: data?.message || "Erro ao validar", 
          variant: "destructive" 
        });
        return false;
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setValidatingKey(null);
    }
  };

  const handleVertexJsonUpload = async (keyId: string, file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      // Validar campos obrigatórios
      if (!json.type || !json.project_id || !json.private_key || !json.client_email) {
        toast({
          title: "❌ JSON inválido",
          description: "Service Account JSON está incompleto. Faltam campos obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar a chave com o JSON
      updateKey('vertex-ai', keyId, 'key', text);
      
      // Extrair project_id automaticamente
      if (json.project_id) {
        updateKey('vertex-ai', keyId, 'projectId', json.project_id);
      }

      toast({
        title: "✅ JSON carregado",
        description: `Service Account: ${json.client_email}`
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao ler arquivo",
        description: "Arquivo JSON inválido ou corrompido",
        variant: "destructive"
      });
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      toast({ title: "Erro", description: "Cole as chaves de API primeiro", variant: "destructive" });
      return;
    }

    const lines = bulkImportText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      toast({ title: "Erro", description: "Nenhuma chave válida encontrada", variant: "destructive" });
      return;
    }

    // Validação em lote
    toast({ title: "Validando...", description: `Testando ${lines.length} chave(s) de API...` });
    setValidatingKeys(true);

    const validationResults = await Promise.all(
      lines.map(async (key, index) => {
        setValidationProgress({ current: index + 1, total: lines.length });
        
        try {
          const { data, error } = await supabase.functions.invoke('test-api-key', {
            body: { provider: bulkImportProvider, apiKey: key }
          });

          if (error) throw error;

          return {
            key,
            valid: data.valid,
            message: data.message,
            errorType: data.errorType,
            keyPrefix: data.keyPrefix
          };
        } catch (err) {
          console.error(`Erro ao validar chave ${index + 1}:`, err);
          return {
            key,
            valid: false,
            message: 'Erro de validação',
            errorType: 'UNKNOWN_ERROR',
            keyPrefix: key.substring(0, 12)
          };
        }
      })
    );

    setValidatingKeys(false);
    setValidationProgress({ current: 0, total: 0 });

    // Contar resultados
    const validCount = validationResults.filter(r => r.valid).length;
    const invalidCount = validationResults.filter(r => r.errorType === 'INVALID_KEY').length;
    const quotaCount = validationResults.filter(r => r.errorType === 'QUOTA_EXCEEDED').length;
    const errorCount = validationResults.filter(r => r.errorType === 'UNKNOWN_ERROR').length;

    // Criar chaves com status apropriado
    const newKeys: ApiKey[] = validationResults.map((result, index) => ({
      id: `bulk-${Date.now()}-${index}`,
      key: result.key,
      is_active: result.valid, // Apenas chaves válidas ficam ativas
      priority: index + 1,
      is_current: false,
      last_used_at: null
    }));

    const setters = {
      youtube: setYoutubeKeys,
      gemini: setGeminiKeys,
      claude: setClaudeKeys,
      openai: setOpenaiKeys,
      huggingface: setHuggingfaceKeys
    };

    const currentKeys = {
      youtube: youtubeKeys,
      gemini: geminiKeys,
      claude: claudeKeys,
      openai: openaiKeys,
      huggingface: huggingfaceKeys
    }[bulkImportProvider];

    setters[bulkImportProvider]?.([...currentKeys, ...newKeys]);

    // Toast detalhado com resultados
    let toastMessage = '';
    if (validCount > 0) toastMessage += `✅ ${validCount} válida(s) `;
    if (quotaCount > 0) toastMessage += `⚠️ ${quotaCount} quota esgotada `;
    if (invalidCount > 0) toastMessage += `❌ ${invalidCount} inválida(s) `;
    if (errorCount > 0) toastMessage += `⚠️ ${errorCount} erro(s) `;

    toast({ 
      title: "Validação concluída!", 
      description: toastMessage.trim(),
      variant: validCount > 0 ? "default" : "destructive"
    });

    setBulkImportText("");
    setBulkImportOpen(false);

    // Auto-save prompt se houver chaves válidas
    if (validCount > 0) {
      const shouldSave = window.confirm(
        `Deseja salvar as ${validCount} chave(s) válida(s) agora? (Recomendado)\n\n` +
        `As chaves inválidas/quota esgotada serão marcadas como inativas.`
      );

      if (shouldSave) {
        await handleSave(bulkImportProvider, [...currentKeys, ...newKeys]);
      }
    }
  };


  const handleManualRevalidation = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    setRevalidating(true);
    toast({ title: "Re-validando...", description: "Testando chaves esgotadas..." });

    try {
      const { data, error } = await supabase.functions.invoke('revalidate-exhausted-keys', {
        body: { triggered_by: 'manual', user_id: user.id }
      });

      if (error) throw error;

      const result = data.results;
      
      toast({
        title: "Re-validação concluída!",
        description: `✅ ${result.reactivated} reativada(s) | ⚠️ ${result.stillExhausted} ainda esgotada(s) | ❌ ${result.errors} erro(s)`,
        variant: result.reactivated > 0 ? "default" : "destructive"
      });

      // Recarregar todas as chaves para mostrar as reativadas
      if (result.reactivated > 0) {
        await loadApiKeys(user.id);
      }
    } catch (error: any) {
      console.error('Erro ao re-validar chaves:', error);
      toast({
        title: "Erro na re-validação",
        description: error.message || 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setRevalidating(false);
    }
  };


  const renderKeySection = (title: string, provider: string, keys: ApiKey[]) => (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex gap-2">
            <Dialog open={bulkImportOpen && bulkImportProvider === provider} onOpenChange={(open) => {
              setBulkImportOpen(open);
              if (open) setBulkImportProvider(provider);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar em Massa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar {title} em Massa</DialogTitle>
                  <DialogDescription>
                    Cole uma chave por linha. A prioridade será atribuída automaticamente (primeira linha = prioridade 1).
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="AIzaSyC...&#10;AIzaSyD...&#10;AIzaSyE..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button 
                  onClick={handleBulkImport} 
                  className="w-full"
                  disabled={validatingKeys}
                >
                  {validatingKeys ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando {validationProgress.current}/{validationProgress.total}...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar e Validar
                    </>
                  )}
                </Button>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={() => addKey(provider)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Key
            </Button>
          </div>
        </div>

        {keys.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma key cadastrada</p>
        )}

        {keys.map((key, index) => (
          <div key={key.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={key.is_active ? "default" : "destructive"}>
                {key.is_active ? "✅ Ativa" : "⚠️ Esgotada"}
              </Badge>
              {key.is_current && <Badge variant="secondary">🎯 Em Uso</Badge>}
              <span className="text-xs text-muted-foreground ml-auto">Prioridade: {key.priority}</span>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                value={key.key}
                onChange={(e) => updateKey(provider, key.id, 'key', e.target.value)}
                placeholder={key.key === '••••••••••••••••' ? 'Chave salva (oculta por segurança)' : 'Cole sua API Key aqui'}
                disabled={key.key === '••••••••••••••••'}
                className="flex-1"
              />
              {key.key !== '••••••••••••••••' && key.key.trim() && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => validateKey(provider, key.id, key.key)}
                  disabled={validatingKey === key.id}
                >
                  {validatingKey === key.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs">Prioridade (1 = usar primeiro)</Label>
                <Slider
                  value={[key.priority]}
                  onValueChange={(v) => updateKey(provider, key.id, 'priority', v[0])}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              <Button size="sm" variant="outline" onClick={() => removeKey(provider, key.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button 
          onClick={() => handleSave(provider, keys)} 
          disabled={savingProvider === provider}
          className="w-full"
        >
          {savingProvider === provider ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {saveProgress.total > 0 
                ? `Criptografando ${saveProgress.current}/${saveProgress.total}...`
                : 'Salvando...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar {title}
            </>
          )}
        </Button>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Configure múltiplas API Keys. Quando uma esgotar, o sistema automaticamente usa a próxima.
        </p>
      </div>

      {user?.email === 'andreanselmolima@gmail.com' && !hasAdminRole && (
        <Card className="p-6 bg-primary/5 border-primary">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">🔐 Configurar Permissões de Admin</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você é o usuário master. Clique no botão abaixo para ativar suas permissões de administrador.
              </p>
              <Button 
                onClick={setupAdmin} 
                disabled={isSettingUpAdmin}
                className="w-full sm:w-auto"
              >
                {isSettingUpAdmin ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Ativar Permissões de Admin
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/20 p-3">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">🔄 Re-validação Automática de Chaves</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Chaves marcadas como esgotadas são automaticamente testadas a cada 24 horas. 
              Se voltarem a funcionar, são reativadas automaticamente no sistema de rotação.
            </p>
            
            <div className="bg-background/60 rounded-lg p-4 space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-background">⏰ Agendamento</Badge>
                <span className="text-muted-foreground">Todos os dias às 3:00 AM UTC</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-background">🎯 Critério</Badge>
                <span className="text-muted-foreground">Chaves inativas há mais de 24 horas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-background">✅ Ação</Badge>
                <span className="text-muted-foreground">Reativação automática se voltarem a funcionar</span>
              </div>
            </div>

            <Button 
              onClick={handleManualRevalidation}
              disabled={revalidating}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {revalidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Re-validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Testar Re-validação Agora
                </>
              )}
            </Button>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>💡 Como funciona:</strong> Chaves que atingiram quota são testadas novamente após 24h. 
                APIs como YouTube/Gemini resetam quotas diariamente, permitindo reutilização automática.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Card>

      {renderKeySection("YouTube API Keys", "youtube", youtubeKeys)}
      {renderKeySection("Gemini API Keys", "gemini", geminiKeys)}
      
      {/* Vertex AI Section - Special rendering com upload de JSON */}
      <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-semibold">💰 Vertex AI (Google Cloud) - PAGO</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Service Account com autenticação OAuth 2.0. <strong>Escalona automaticamente quando Gemini gratuito esgotar.</strong>
              </p>
            </div>
            <Button size="sm" onClick={() => addKey('vertex-ai')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Credencial
            </Button>
          </div>

          {vertexKeys.length === 0 && (
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Nenhuma credencial Vertex AI cadastrada</p>
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>💡 Economia Inteligente:</strong> Suas chaves Gemini gratuitas serão usadas primeiro. 
                  Vertex AI só será usado quando todas as chaves Gemini estiverem esgotadas.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {vertexKeys.map((key, index) => (
            <div key={key.id} className="border rounded-lg p-4 space-y-3 bg-background/30">
              <div className="flex items-center gap-2">
                <Badge variant={key.is_active ? "default" : "destructive"}>
                  {key.is_active ? "✅ Ativa" : "⚠️ Esgotada"}
                </Badge>
                <Badge variant="secondary">💰 PAGO</Badge>
                {key.is_current && <Badge variant="secondary">🎯 Em Uso</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">Prioridade: {key.priority}</span>
              </div>

              {/* Upload JSON */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Service Account JSON</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVertexJsonUpload(key.id, file);
                    }}
                    disabled={key.key !== '' && key.key !== '••••••••••••••••'}
                    className="flex-1"
                  />
                  {key.key === '••••••••••••••••' && (
                    <Badge variant="outline" className="self-center whitespace-nowrap">✅ JSON Salvo</Badge>
                  )}
                </div>
                {key.key && key.key !== '••••••••••••••••' && (
                  <p className="text-xs text-muted-foreground">
                    ✅ JSON carregado ({key.key.length} caracteres)
                  </p>
                )}
              </div>

              {/* Project ID */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Google Cloud Project ID</Label>
                <Input
                  type="text"
                  value={key.projectId || ''}
                  onChange={(e) => updateKey('vertex-ai', key.id, 'projectId', e.target.value)}
                  placeholder="my-project-id"
                  className="font-mono text-sm"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Region/Location</Label>
                <select
                  value={key.location || 'us-central1'}
                  onChange={(e) => updateKey('vertex-ai', key.id, 'location', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="us-central1">us-central1 (Iowa)</option>
                  <option value="us-east1">us-east1 (South Carolina)</option>
                  <option value="us-west1">us-west1 (Oregon)</option>
                  <option value="europe-west1">europe-west1 (Belgium)</option>
                  <option value="europe-west4">europe-west4 (Netherlands)</option>
                  <option value="asia-northeast1">asia-northeast1 (Tokyo)</option>
                  <option value="asia-southeast1">asia-southeast1 (Singapore)</option>
                </select>
              </div>

              {/* Validar Credenciais */}
              {key.key && key.key !== '••••••••••••••••' && key.projectId && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => validateVertexKey(key.id, key.key, key.projectId!, key.location || 'us-central1')}
                  disabled={validatingKey === key.id}
                  className="w-full"
                >
                  {validatingKey === key.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Validar Credenciais
                    </>
                  )}
                </Button>
              )}

              {/* Prioridade e Remover */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs">Prioridade (1 = usar primeiro)</Label>
                  <Slider
                    value={[key.priority]}
                    onValueChange={(v) => updateKey('vertex-ai', key.id, 'priority', v[0])}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={() => removeKey('vertex-ai', key.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {vertexKeys.length > 0 && (
            <Button 
              onClick={() => handleSave('vertex-ai', vertexKeys)} 
              disabled={savingProvider === 'vertex-ai'}
              className="w-full"
            >
              {savingProvider === 'vertex-ai' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {saveProgress.total > 0 
                    ? `Criptografando ${saveProgress.current}/${saveProgress.total}...`
                    : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Credenciais Vertex AI
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
      
      {renderKeySection("Claude API Keys", "claude", claudeKeys)}
      {renderKeySection("OpenAI API Keys", "openai", openaiKeys)}
      
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Key className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">🤗 HuggingFace Access Token</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Adicione seu Access Token do HuggingFace para usar os modelos premium sem limites. 
                Seus tokens são criptografados e armazenados com segurança.
              </p>
              <div className="bg-background/50 rounded-lg p-3 space-y-2 text-sm">
                <p className="font-semibold">📝 Como obter seu Access Token:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Acesse <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">huggingface.co/settings/tokens</a></li>
                  <li>Clique em "New token" e dê um nome (ex: "Gerador de Imagens")</li>
                  <li>Selecione o tipo "Read" (suficiente para geração de imagens)</li>
                  <li>Copie o token gerado e cole abaixo</li>
                </ol>
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>💡 Dica:</strong> Com uma conta HuggingFace PRO você tem 20x mais créditos mensais gratuitos!
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {renderKeySection("HuggingFace Access Tokens", "huggingface", huggingfaceKeys)}
    </div>
  );
};

export default Configuracoes;
