// Helper functions for niche analysis

export interface Video {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  viewCount: number;
  subscriberCount: number;
  publishedAt: string;
  ageInDays: number;
  vph: number;
  engagement: number;
  viralScore: number;
  viewSubRatio: number;
  channelAgeInDays?: number;
}

export interface NicheMetrics {
  totalViews: number;
  avgVPH: number;
  uniqueChannels: number;
  avgSubscribers: number;
  channelDistribution: {
    small: number;  // <10K
    medium: number; // 10K-100K
    large: number;  // >100K
  };
  saturationScore: number; // 0-100
  trendScore: number; // -100 to +100
  opportunityScore: number; // 0-100
}

export interface NicheAnalysis {
  id: string;
  name: string;
  description: string;
  videoIds: string[];
  keywords: string[];
  specificity: 'broad' | 'sub-niche' | 'micro-niche';
  metrics: NicheMetrics;
}

export function calculateChannelDistribution(videos: Video[]): {
  small: number;
  medium: number;
  large: number;
} {
  const channels = new Map<string, number>();
  
  // Get unique channels with their subscriber counts
  videos.forEach(v => {
    if (!channels.has(v.channelId)) {
      channels.set(v.channelId, v.subscriberCount);
    }
  });

  const channelArray = Array.from(channels.values());
  const total = channelArray.length;

  if (total === 0) return { small: 0, medium: 0, large: 0 };

  const small = channelArray.filter(s => s < 10000).length;
  const medium = channelArray.filter(s => s >= 10000 && s < 100000).length;
  const large = channelArray.filter(s => s >= 100000).length;

  return {
    small: Math.round((small / total) * 100),
    medium: Math.round((medium / total) * 100),
    large: Math.round((large / total) * 100),
  };
}

export function calculateSaturationScore(videos: Video[]): number {
  const channels = new Map<string, number>();
  
  videos.forEach(v => {
    if (!channels.has(v.channelId)) {
      channels.set(v.channelId, v.subscriberCount);
    }
  });

  const channelSizes = Array.from(channels.values());
  const largeChannels = channelSizes.filter(s => s > 100000).length;
  const totalChannels = channelSizes.length;
  
  if (totalChannels === 0) return 0;
  
  // High saturation = many large channels
  return Math.round((largeChannels / totalChannels) * 100);
}

export function detectTrend(videos: Video[]): number {
  const now = Date.now();
  
  // Recent videos (last 30 days)
  const recent = videos.filter(v => {
    const age = now - new Date(v.publishedAt).getTime();
    return age < 30 * 24 * 60 * 60 * 1000;
  });
  
  // Older videos (30-60 days ago)
  const older = videos.filter(v => {
    const age = now - new Date(v.publishedAt).getTime();
    return age >= 30 * 24 * 60 * 60 * 1000 && age < 60 * 24 * 60 * 60 * 1000;
  });

  if (recent.length === 0 || older.length === 0) return 0;
  
  const recentAvgViews = recent.reduce((sum, v) => sum + v.viewCount, 0) / recent.length;
  const olderAvgViews = older.reduce((sum, v) => sum + v.viewCount, 0) / older.length;
  
  if (olderAvgViews === 0) return 0;
  
  // Positive = growing, Negative = declining
  return Math.round(((recentAvgViews - olderAvgViews) / olderAvgViews) * 100);
}

export function calculateOpportunityScore(metrics: NicheMetrics): number {
  // Virality: Higher VPH = better (max 100 points)
  const viralityWeight = Math.min(metrics.avgVPH / 100, 100) * 0.35;
  
  // Competition: Fewer channels = better
  const competitionWeight = Math.max(0, 100 - metrics.uniqueChannels) * 0.25;
  
  // Saturation: Lower saturation = better
  const saturationWeight = (100 - metrics.saturationScore) * 0.25;
  
  // Trend: Positive trend = better
  const trendWeight = Math.max(0, metrics.trendScore) * 0.15;
  
  const score = viralityWeight + competitionWeight + saturationWeight + trendWeight;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function calculateNicheMetrics(videos: Video[]): NicheMetrics {
  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
  const avgVPH = videos.reduce((sum, v) => sum + v.vph, 0) / videos.length;
  
  const uniqueChannels = new Set(videos.map(v => v.channelId)).size;
  const avgSubscribers = videos.reduce((sum, v) => sum + v.subscriberCount, 0) / videos.length;
  
  const channelDistribution = calculateChannelDistribution(videos);
  const saturationScore = calculateSaturationScore(videos);
  const trendScore = detectTrend(videos);
  
  const metrics: NicheMetrics = {
    totalViews,
    avgVPH: Math.round(avgVPH),
    uniqueChannels,
    avgSubscribers: Math.round(avgSubscribers),
    channelDistribution,
    saturationScore,
    trendScore,
    opportunityScore: 0, // Will be calculated next
  };
  
  metrics.opportunityScore = calculateOpportunityScore(metrics);
  
  return metrics;
}
