/**
 * Sistema de Autenticação OAuth 2.0 para Google Cloud Vertex AI
 * Gera e gerencia access tokens a partir de Service Account JSON
 */

interface ServiceAccountJson {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface VertexAccessToken {
  access_token: string;
  expires_at: number; // Unix timestamp
}

// Cache de tokens em memória (válido durante a execução da edge function)
const tokenCache = new Map<string, VertexAccessToken>();

/**
 * Gera JWT assinado para autenticação OAuth 2.0
 */
async function createSignedJWT(
  serviceAccount: ServiceAccountJson,
  scope: string = 'https://www.googleapis.com/auth/cloud-platform'
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hora

  // Header do JWT
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  };

  // Payload do JWT
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri,
    scope: scope,
    iat: now,
    exp: expiry
  };

  // Encoder base64url
  const base64url = (data: string): string => {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Importar chave privada
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  // Assinar o token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64url(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${unsignedToken}.${encodedSignature}`;
}

/**
 * Converte PEM para ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Troca JWT por OAuth 2.0 Access Token
 */
async function exchangeJWTForToken(jwt: string, tokenUri: string): Promise<VertexAccessToken> {
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Vertex Auth] Erro ao trocar JWT por token:', errorText);
    throw new Error(`Failed to exchange JWT: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

  return {
    access_token: data.access_token,
    expires_at: expiresAt
  };
}

/**
 * Obtém Access Token válido para Vertex AI (com cache)
 * @param serviceAccountJson - JSON completo do Service Account
 * @returns Access Token OAuth 2.0 válido
 */
export async function getVertexAccessToken(
  serviceAccountJson: string | ServiceAccountJson
): Promise<string> {
  let serviceAccount: ServiceAccountJson;

  // Parse JSON se vier como string
  if (typeof serviceAccountJson === 'string') {
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error) {
      console.error('❌ [Vertex Auth] JSON inválido:', error);
      throw new Error('Invalid Service Account JSON');
    }
  } else {
    serviceAccount = serviceAccountJson;
  }

  // Validar campos obrigatórios
  if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.token_uri) {
    throw new Error('Service Account JSON incompleto. Faltam campos obrigatórios.');
  }

  const cacheKey = serviceAccount.client_email;

  // Verificar cache (token válido por pelo menos 5 minutos)
  const cached = tokenCache.get(cacheKey);
  const now = Math.floor(Date.now() / 1000);
  
  if (cached && cached.expires_at > now + 300) {
    console.log('✅ [Vertex Auth] Usando token do cache');
    return cached.access_token;
  }

  console.log('🔄 [Vertex Auth] Gerando novo access token...');

  // Gerar JWT assinado
  const jwt = await createSignedJWT(serviceAccount);

  // Trocar JWT por access token
  const tokenData = await exchangeJWTForToken(jwt, serviceAccount.token_uri);

  // Armazenar em cache
  tokenCache.set(cacheKey, tokenData);

  console.log(`✅ [Vertex Auth] Token gerado com sucesso (expira em ${new Date(tokenData.expires_at * 1000).toISOString()})`);

  return tokenData.access_token;
}

/**
 * Limpa cache de tokens (útil para testes)
 */
export function clearVertexTokenCache(): void {
  tokenCache.clear();
  console.log('🗑️ [Vertex Auth] Cache de tokens limpo');
}
