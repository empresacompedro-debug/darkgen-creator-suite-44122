// Helper para construir requisições Gemini ou Vertex AI com base no provider retornado
import { getVertexAccessToken } from './vertex-auth.ts';

export async function buildGeminiOrVertexRequest(
  keyData: { key: string; provider?: string; vertexConfig?: any },
  model: string,
  prompt: string,
  stream: boolean = false
): Promise<{ url: string; headers: Record<string, string>; body: any }> {
  const provider = keyData.provider || 'gemini';
  
  if (provider === 'vertex-ai' && keyData.vertexConfig) {
    // Vertex AI request
    const { projectId, location, serviceAccountJson } = keyData.vertexConfig;
    const accessToken = await getVertexAccessToken(serviceAccountJson);
    
    // Mapear modelo Gemini para Vertex AI
    const vertexModel = model.replace('gemini-', 'gemini-').replace('2.5', '2.0'); // Vertex usa naming diferente
    
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${vertexModel}:${stream ? 'streamGenerateContent' : 'generateContent'}`;
    
    return {
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95
        }
      }
    };
  } else {
    // Gemini (free) request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?${stream ? 'alt=sse&' : ''}key=${keyData.key}`;
    
    return {
      url,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95
        }
      }
    };
  }
}
