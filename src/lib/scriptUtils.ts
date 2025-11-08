/**
 * Limpa marcações técnicas do roteiro para uso em prompts de cena
 */
export function cleanScriptMarkings(script: string): string {
  let cleaned = script;

  // Remover títulos markdown: # Título, ## Subtítulo, ### etc
  cleaned = cleaned.replace(/^#{1,6}\s+.+$/gm, '');

  // Remover estruturas de partes: ## PARTE 1 (1000 palavras), ## PARTE 2, etc
  cleaned = cleaned.replace(/^##?\s*PARTE\s+\d+\s*(?:\([^)]+\))?$/gmi, '');

  // Remover marcações de cena: [CENA 1], [CENA 1 - Título], etc.
  cleaned = cleaned.replace(/\[CENA\s+\d+(?:\s*[-:]\s*[^\]]+)?\]/gi, '');

  // Remover marcações de áudio: [MÚSICA:], [SFX:], [SOUND:]
  cleaned = cleaned.replace(/\[(MÚSICA|SFX|SOUND):[^\]]*\]/gi, '');

  // Remover transições: [FADE IN], [FADE OUT], [CUT TO:], [DISSOLVE TO:]
  cleaned = cleaned.replace(/\[(FADE\s+IN|FADE\s+OUT|CUT\s+TO|DISSOLVE\s+TO):[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[(FADE\s+IN|FADE\s+OUT)\]/gi, '');

  // Remover estrutura: **PARTE 1:**, **INTRODUÇÃO:**, etc.
  cleaned = cleaned.replace(/\*\*(PARTE\s+\d+|INTRODUÇÃO|DESENVOLVIMENTO|CONCLUSÃO):[^\*]*\*\*/gi, '');

  // Remover técnicas cinematográficas: [INT.], [EXT.], [V.O.]
  cleaned = cleaned.replace(/\[(INT\.|EXT\.|V\.O\.)\]/gi, '');

  // Normalizar múltiplas quebras de linha (max 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remover espaços extras
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Remover linhas vazias no início e fim
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Conta palavras no roteiro
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
