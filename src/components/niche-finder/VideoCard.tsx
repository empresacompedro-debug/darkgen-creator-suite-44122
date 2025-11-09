import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

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

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-all">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <a 
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative group"
          >
            <img 
              src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
              alt={video.title}
              className="w-48 h-27 object-cover rounded-md group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </a>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <a 
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {video.title}
            </h3>
          </a>
          
          <a
            href={`https://www.youtube.com/channel/${video.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {video.channelTitle}
          </a>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="default">
              Score: {video.viralScore?.toFixed(1) || 'N/A'}
            </Badge>
            <Badge variant="secondary">
              {formatNumber(video.viewCount)} views
            </Badge>
            <Badge variant="secondary">
              VPH: {formatNumber(video.vph || 0)}
            </Badge>
            <Badge variant="outline">
              {formatNumber(video.subscriberCount || 0)} subs
            </Badge>
            <Badge variant="outline">
              {formatDuration(video.durationSeconds || 0)}
            </Badge>
            {video.ageInDays && (
              <Badge variant="outline">
                {video.ageInDays}d atrás
              </Badge>
            )}
          </div>

          {video.engagement && (
            <div className="mt-2 text-xs text-muted-foreground">
              Engajamento: {(video.engagement * 100).toFixed(2)}%
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
