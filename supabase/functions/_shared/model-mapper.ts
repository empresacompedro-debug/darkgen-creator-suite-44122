/**
 * Mapeia modelo de IA selecionado pelo usuário para o provider correto
 * Exemplo: "vertex-gemini-2.5-pro" → { provider: "vertex-ai", model: "gemini-2.5-pro" }
 */
export function mapModelToProvider(aiModel: string): {
  provider: 'claude' | 'gemini' | 'openai' | 'vertex-ai';
  model: string;
} {
  // Vertex AI (Google Cloud)
  if (aiModel.startsWith('vertex-')) {
    return {
      provider: 'vertex-ai',
      model: aiModel.replace('vertex-', '') // "vertex-gemini-2.5-pro" → "gemini-2.5-pro"
    };
  }
  
  // Claude (Anthropic)
  if (aiModel.startsWith('claude')) {
    return { provider: 'claude', model: aiModel };
  }
  
  // OpenAI
  if (aiModel.startsWith('gpt') || aiModel.startsWith('o1') || aiModel.startsWith('o3') || aiModel.startsWith('o4')) {
    return { provider: 'openai', model: aiModel };
  }
  
  // Gemini (API gratuita do Google)
  if (aiModel.startsWith('gemini')) {
    return { provider: 'gemini', model: aiModel };
  }
  
  // Fallback: assumir Gemini
  console.warn(`⚠️ [model-mapper] Unknown model "${aiModel}", defaulting to Gemini`);
  return { provider: 'gemini', model: aiModel };
}
