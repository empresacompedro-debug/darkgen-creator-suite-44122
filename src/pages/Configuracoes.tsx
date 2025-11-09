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

const Configuracoes = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [youtubeKeys, setYoutubeKeys] = useState<ApiKey[]>([]);
  const [geminiKeys, setGeminiKeys] = useState<ApiKey[]>([]);
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
        claude: [] as ApiKey[],
        openai: [] as ApiKey[],
        huggingface: [] as ApiKey[]
      };

      data?.forEach((key: any) => {
        const apiKey: ApiKey = {
          id: key.id,
          key: '••••••••••••••••', // Don't show encrypted key, just placeholder
          is_active: key.is_active,
          priority: key.priority || 1,
          is_current: key.is_current || false,
          last_used_at: key.last_used_at
        };

        if (key.api_provider in groupedKeys) {
          groupedKeys[key.api_provider as keyof typeof groupedKeys].push(apiKey);
        }
      });

      setYoutubeKeys(groupedKeys.youtube);
      setGeminiKeys(groupedKeys.gemini);
      setClaudeKeys(groupedKeys.claude);
      setOpenaiKeys(groupedKeys.openai);
      setHuggingfaceKeys(groupedKeys.huggingface);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
    }
  };

  const handleSave = async (provider: string, keys: ApiKey[]) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    const PLACEHOLDER = '••••••••••••••••';

    try {
      // Separar o que é atualização (chaves já existentes) do que é inserção (novas chaves)
      const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const existingToUpdate = keys.filter((k) => isUUID(k.id) && k.key === PLACEHOLDER);
      const newToInsert = keys.filter((k) => !isUUID(k.id) && k.key.trim() && k.key !== PLACEHOLDER);

      console.log(`🔐 Processando ${existingToUpdate.length} atualização(ões) e ${newToInsert.length} nova(s) chave(s) para ${provider}...`);

      // 1) Atualizar prioridades das chaves existentes (sem sobrescrever o valor da key)
      for (let i = 0; i < existingToUpdate.length; i++) {
        const k = existingToUpdate[i];
        const { error: updateError } = await supabase
          .from('user_api_keys')
          .update({ priority: k.priority, updated_at: new Date().toISOString() })
          .eq('id', k.id);
        if (updateError) {
          console.error('❌ Erro ao atualizar prioridade:', updateError);
          throw new Error(`Erro ao atualizar prioridade da chave ${i + 1}: ${updateError.message}`);
        }
      }

      // 2) Inserir novas chaves (criptografadas)
      for (let i = 0; i < newToInsert.length; i++) {
        const k = newToInsert[i];
        console.log(`🔑 Criptografando nova chave ${i + 1}/${newToInsert.length}...`);
        const { data: encryptedKey, error: encryptError } = await supabase
          .rpc('encrypt_api_key', { p_key: k.key.trim(), p_user_id: user.id });
        if (encryptError) {
          console.error('❌ Erro ao criptografar:', encryptError);
          throw new Error(`Erro ao criptografar chave ${i + 1}: ${encryptError.message}`);
        }

        console.log(`💾 Inserindo nova chave ${i + 1} no banco...`);
        const { error: insertError } = await supabase
          .from('user_api_keys')
          .insert({
            user_id: user.id,
            api_provider: provider,
            api_key_encrypted: encryptedKey,
            is_active: true,
            priority: k.priority || 1,
            updated_at: new Date().toISOString(),
          });
        if (insertError) {
          console.error('❌ Erro ao inserir no banco:', insertError);
          throw new Error(`Erro ao inserir chave ${i + 1}: ${insertError.message}`);
        }
      }

      // Feedback
      await loadApiKeys(user.id);
      const total = existingToUpdate.length + newToInsert.length;
      toast({
        title: 'Salvo!',
        description: `${total} item(ns) processado(s). ${newToInsert.length} chave(s) adicionada(s) e ${existingToUpdate.length} prioridade(s) atualizada(s).`,
      });
    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };
  const addKey = (provider: string) => {
    const newKey: ApiKey = {
      id: `new-${Date.now()}`,
      key: '',
      is_active: true,
      priority: 1,
      is_current: false
    };

    switch(provider) {
      case 'youtube': setYoutubeKeys([...youtubeKeys, newKey]); break;
      case 'gemini': setGeminiKeys([...geminiKeys, newKey]); break;
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
        case 'claude': setClaudeKeys(claudeKeys.filter(k => k.id !== id)); break;
        case 'openai': setOpenaiKeys(openaiKeys.filter(k => k.id !== id)); break;
        case 'huggingface': setHuggingfaceKeys(huggingfaceKeys.filter(k => k.id !== id)); break;
      }
    }
  };

  const updateKey = (provider: string, id: string, field: string, value: any) => {
    const updater = (keys: ApiKey[]) => keys.map(k => k.id === id ? { ...k, [field]: value } : k);
    
    switch(provider) {
      case 'youtube': setYoutubeKeys(updater(youtubeKeys)); break;
      case 'gemini': setGeminiKeys(updater(geminiKeys)); break;
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

  const handleBulkImport = () => {
    const lines = bulkImportText.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      toast({ title: "Aviso", description: "Cole as chaves no campo de texto", variant: "default" });
      return;
    }

    const newKeys: ApiKey[] = lines.map((line, index) => ({
      id: `bulk-${Date.now()}-${index}`,
      key: line.trim(),
      is_active: true,
      priority: index + 1,
      is_current: false
    }));

    switch(bulkImportProvider) {
      case 'youtube': setYoutubeKeys([...youtubeKeys, ...newKeys]); break;
      case 'gemini': setGeminiKeys([...geminiKeys, ...newKeys]); break;
      case 'claude': setClaudeKeys([...claudeKeys, ...newKeys]); break;
      case 'openai': setOpenaiKeys([...openaiKeys, ...newKeys]); break;
      case 'huggingface': setHuggingfaceKeys([...huggingfaceKeys, ...newKeys]); break;
    }

    toast({ title: "Importado!", description: `${lines.length} chave(s) importada(s)` });
    setBulkImportText("");
    setBulkImportOpen(false);
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
                <Button onClick={handleBulkImport} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {bulkImportText.trim().split('\n').filter(l => l.trim()).length} Chave(s)
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

        <Button onClick={() => handleSave(provider, keys)} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salvar {title}
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

      {renderKeySection("YouTube API Keys", "youtube", youtubeKeys)}
      {renderKeySection("Gemini API Keys", "gemini", geminiKeys)}
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
