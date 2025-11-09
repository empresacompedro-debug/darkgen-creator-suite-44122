import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExternalLink, Eye, TrendingUp, Zap, Users, Calendar, Clock } from "lucide-react";

interface VideoCardProps {
  video: any;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getChannelAgeCategory = (days: number) => {
  if (days < 365) return { label: "Novo", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" };
  if (days < 1095) return { label: "Crescendo", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" };
  if (days < 1825) return { label: "Estabelecido", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" };
  return { label: "Veterano", color: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20" };
};

const getSubscriberCategory = (subs: number) => {
  if (subs < 10000) return { label: "Micro", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" };
  if (subs < 100000) return { label: "Pequeno", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" };
  if (subs < 1000000) return { label: "Médio", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" };
  return { label: "Grande", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" };
};

const formatChannelAge = (days: number): string => {
  if (days < 365) return `${days}d`;
  const years = (days / 365).toFixed(1);
  return `${years} anos`;
};

export function VideoCard({ video }: VideoCardProps) {
  const channelAge = video.channelAgeInDays || 0;
  const channelAgeCategory = getChannelAgeCategory(channelAge);
  const subscriberCategory = getSubscriberCategory(video.subscriberCount || 0);

  return (
    <Card className="p-6 hover:shadow-xl transition-all border-2 hover:border-primary/20">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <a 
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative group"
          >
            <img 
              src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
              alt={video.title}
              className="w-full h-[180px] object-cover rounded-lg group-hover:opacity-80 transition-opacity shadow-md"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
              <ExternalLink className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
            {video.durationSeconds && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-semibold">
                <Clock className="inline h-3 w-3 mr-1" />
                {formatDuration(video.durationSeconds)}
              </div>
            )}
          </a>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {/* Title and Channel */}
          <div>
            <a 
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
            </a>
            
            <a
              href={`https://www.youtube.com/channel/${video.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              📺 {video.channelTitle}
            </a>
          </div>

          {/* Primary Metrics - Large */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">SCORE</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {video.viralScore?.toFixed(1) || 'N/A'}
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-foreground" />
                <span className="text-xs font-medium text-muted-foreground">VIEWS</span>
              </div>
              <p className="text-2xl font-bold">
                {formatNumber(video.viewCount)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-3 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-muted-foreground">VPH</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {formatNumber(video.vph || 0)}
              </p>
            </div>
          </div>

          {/* Secondary Metrics - Highlighted */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-lg border-2 ${subscriberCategory.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Inscritos</span>
              </div>
              <p className="text-xl font-bold mb-1">
                {formatNumber(video.subscriberCount || 0)}
              </p>
              <Badge variant="outline" className={`text-xs ${subscriberCategory.color} border-0`}>
                {subscriberCategory.label}
              </Badge>
            </div>

            <div className={`p-4 rounded-lg border-2 ${channelAgeCategory.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Idade do Canal</span>
              </div>
              <p className="text-xl font-bold mb-1">
                {formatChannelAge(channelAge)}
              </p>
              <Badge variant="outline" className={`text-xs ${channelAgeCategory.color} border-0`}>
                {channelAgeCategory.label}
              </Badge>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {video.ageInDays && (
              <span className="flex items-center gap-1">
                📅 Vídeo: {video.ageInDays}d atrás
              </span>
            )}
            {video.engagement && (
              <span className="flex items-center gap-1">
                💬 Engajamento: {(video.engagement * 100).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
