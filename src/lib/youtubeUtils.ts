/**
 * Extrai o videoId de URLs do YouTube em vários formatos
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Gera URLs de thumbnail do YouTube em diferentes resoluções
 */
export function getThumbnailUrls(videoId: string): { url: string; resolution: string }[] {
  return [
    { url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, resolution: 'maxres' },
    { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, resolution: 'hq' },
    { url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, resolution: 'mq' },
  ];
}

/**
 * Verifica se uma thumbnail existe (fazendo fetch)
 */
export async function checkThumbnailExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Converte imagem URL para base64
 */
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Busca título do vídeo usando oEmbed API do YouTube (sem auth necessária)
 */
export async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!response.ok) throw new Error('Failed to fetch video info');
    const data = await response.json();
    return data.title || `Vídeo ${videoId}`;
  } catch (error) {
    console.error('Error fetching video title:', error);
    return `Vídeo ${videoId}`;
  }
}

export interface ExtractedThumbnail {
  id: string;
  videoId: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  resolution: 'maxres' | 'hq' | 'mq';
  base64?: string;
}

/**
 * Extrai thumbnail de um vídeo do YouTube
 */
export async function fetchThumbnail(url: string): Promise<ExtractedThumbnail | null> {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  const thumbnailOptions = getThumbnailUrls(videoId);

  // Tentar cada resolução em ordem
  for (const { url: thumbnailUrl, resolution } of thumbnailOptions) {
    const exists = await checkThumbnailExists(thumbnailUrl);
    if (exists) {
      const title = await fetchVideoTitle(videoId);
      return {
        id: `${videoId}-${Date.now()}`,
        videoId,
        url,
        thumbnailUrl,
        title,
        resolution: resolution as 'maxres' | 'hq' | 'mq',
      };
    }
  }

  return null;
}
