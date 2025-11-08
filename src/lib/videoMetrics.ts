export interface VideoWithMetrics {
  id: string;
  monitor_id: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  vph: number;
  days_since_upload: number;
  is_explosive: boolean;
  explosive_reason?: string | null;
  competitor_monitors?: {
    channel_title: string;
    channel_thumbnail: string;
    subscriber_count: number;
  };
  // Métricas derivadas
  engagementRate: number;
  viewsPerSubscriber: number;
  growthVelocity: number;
  explosiveScore: number;
}

export function calculateMetrics(video: any): VideoWithMetrics {
  // Validação crítica: verificar se competitor_monitors existe
  if (!video.competitor_monitors) {
    console.warn('⚠️ Vídeo sem dados de competitor_monitors:', video.video_id);
    return {
      ...video,
      engagementRate: 0,
      viewsPerSubscriber: 0,
      growthVelocity: 0,
      explosiveScore: 0,
    };
  }

  const subscriberCount = video.competitor_monitors?.subscriber_count || 1;
  
  // Validação: evitar divisão por zero ou valores inválidos
  if (subscriberCount === 0 || !subscriberCount || subscriberCount < 0) {
    console.warn('⚠️ Subscriber count inválido para vídeo:', video.video_id, subscriberCount);
  }

  const safeSubscriberCount = Math.max(subscriberCount || 1, 1);
  
  // Taxa de Engajamento: ((likes + comments) / views) * 100
  const engagementRate = video.view_count > 0
    ? (((video.like_count || 0) + (video.comment_count || 0)) / video.view_count) * 100
    : 0;

  // Proporção Views/Inscritos
  const viewsPerSubscriber = video.view_count / safeSubscriberCount;

  // Velocidade de Crescimento: (vph * 24) / days_since_upload
  const growthVelocity = video.days_since_upload > 0
    ? (video.vph * 24) / video.days_since_upload
    : video.vph * 24;

  // Score de Explosividade (0-100)
  // Normalizar cada métrica e combinar com pesos
  const vphNormalized = Math.min((video.vph / 10000) * 40, 40); // Max 40 pontos
  const ratioNormalized = Math.min((viewsPerSubscriber / 10) * 30, 30); // Max 30 pontos
  const engagementNormalized = Math.min((engagementRate / 10) * 30, 30); // Max 30 pontos
  
  const explosiveScore = Math.round(vphNormalized + ratioNormalized + engagementNormalized);

  const result = {
    ...video,
    engagementRate: Math.round(engagementRate * 100) / 100,
    viewsPerSubscriber: Math.round(viewsPerSubscriber * 100) / 100,
    growthVelocity: Math.round(growthVelocity),
    explosiveScore: Math.min(explosiveScore, 100),
  };

  // Validação final: verificar se há NaN nas métricas
  if (isNaN(result.engagementRate) || isNaN(result.viewsPerSubscriber) || 
      isNaN(result.growthVelocity) || isNaN(result.explosiveScore)) {
    console.error('❌ Métricas inválidas (NaN) para vídeo:', video.video_id, result);
  }

  return result;
}

export function getChannelSize(subscriberCount: number): string {
  // Validação: tratar valores inválidos
  if (!subscriberCount || subscriberCount <= 0 || isNaN(subscriberCount)) {
    console.warn('⚠️ Subscriber count inválido em getChannelSize:', subscriberCount);
    return "micro";
  }
  
  if (subscriberCount < 10000) return "micro";
  if (subscriberCount < 100000) return "small";
  if (subscriberCount < 1000000) return "medium";
  return "large";
}

export function getVideoStatus(days: number): string {
  // Validação: tratar valores inválidos
  if (days < 0 || isNaN(days)) {
    console.warn('⚠️ Days inválido em getVideoStatus:', days);
    return "new";
  }
  
  if (days <= 3) return "new";
  if (days <= 7) return "recent";
  if (days <= 30) return "established";
  return "old";
}

export function getViralityLevel(vph: number): string {
  // Validação: tratar valores inválidos
  if (vph < 0 || isNaN(vph)) {
    console.warn('⚠️ VPH inválido em getViralityLevel:', vph);
    return "explosive";
  }
  
  if (vph > 5000) return "mega";
  if (vph > 2000) return "high";
  if (vph > 500) return "viral";
  return "explosive";
}
