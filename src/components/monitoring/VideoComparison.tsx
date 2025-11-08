import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Eye, Heart, MessageCircle, TrendingUp, Calendar } from "lucide-react";
import type { VideoWithMetrics } from "@/lib/videoMetrics";

interface VideoComparisonProps {
  videos: VideoWithMetrics[];
  onClose: () => void;
  onRemoveVideo: (videoId: string) => void;
}

export function VideoComparison({ videos, onClose, onRemoveVideo }: VideoComparisonProps) {
  // Análise de padrões em títulos
  const analyzePatterns = () => {
    const allWords = videos
      .flatMap(v => v.title.toLowerCase().split(/\s+/))
      .filter(word => word.length > 3); // Ignorar palavras curtas
    
    const wordFrequency = allWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonWords = Object.entries(wordFrequency)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return commonWords;
  };

  const patterns = videos.length >= 2 ? analyzePatterns() : [];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto">
      <div className="container mx-auto p-4 min-h-screen">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-background/95 backdrop-blur py-4 z-10">
          <h2 className="text-2xl font-bold">🔍 Comparação de Vídeos ({videos.length})</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Padrões Identificados */}
        {patterns.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">🎯 Padrões Identificados nos Títulos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {patterns.map((word) => (
                  <Badge key={word} variant="secondary" className="text-sm">
                    {word}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Palavras que aparecem em 2+ vídeos (podem indicar tendências de conteúdo)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Grid de Comparação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="relative">
              <Button
                onClick={() => onRemoveVideo(video.video_id)}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-background/80"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Thumbnail */}
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-40 object-cover rounded-t-lg"
              />

              <CardContent className="p-4 space-y-3">
                {/* Título */}
                <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>

                {/* Canal */}
                {video.competitor_monitors && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={video.competitor_monitors.channel_thumbnail} 
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {video.competitor_monitors.channel_title}
                    </span>
                  </div>
                )}

                {/* Badges */}
                <div className="flex gap-1 flex-wrap">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs">
                    ⭐ {video.explosiveScore}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    🔥 {formatNumber(video.vph)} VPH
                  </Badge>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(video.view_count)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{video.days_since_upload}d</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>{formatNumber(video.like_count || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{formatNumber(video.comment_count || 0)}</span>
                  </div>
                </div>

                {/* Métricas Derivadas */}
                <div className="space-y-1 text-[10px] pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engajamento:</span>
                    <span className="font-semibold">{video.engagementRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Views/Subs:</span>
                    <span className="font-semibold">{video.viewsPerSubscriber.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Velocidade:</span>
                    <span className="font-semibold">{formatNumber(video.growthVelocity)}/dia</span>
                  </div>
                </div>

                {/* Link */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <a 
                    href={`https://youtube.com/watch?v=${video.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver no YouTube
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela Comparativa */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📊 Tabela Comparativa de Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Vídeo</th>
                    <th className="text-right p-2">VPH</th>
                    <th className="text-right p-2">Views</th>
                    <th className="text-right p-2">Likes</th>
                    <th className="text-right p-2">Comentários</th>
                    <th className="text-right p-2">Engajamento</th>
                    <th className="text-right p-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 max-w-xs truncate">{video.title}</td>
                      <td className="text-right p-2 font-semibold">{formatNumber(video.vph)}</td>
                      <td className="text-right p-2">{formatNumber(video.view_count)}</td>
                      <td className="text-right p-2">{formatNumber(video.like_count || 0)}</td>
                      <td className="text-right p-2">{formatNumber(video.comment_count || 0)}</td>
                      <td className="text-right p-2">{video.engagementRate.toFixed(2)}%</td>
                      <td className="text-right p-2 font-bold">{video.explosiveScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
