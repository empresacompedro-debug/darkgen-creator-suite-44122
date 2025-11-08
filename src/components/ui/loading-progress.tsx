import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Zap } from "lucide-react";

export interface LoadingStage {
  stage: string;
  icon: string;
  label: string;
}

export interface LoadingProgressProps {
  stages: LoadingStage[];
  currentStage: string;
  percentage: number;
  estimatedTimeRemaining: number;
  stageLabel: string;
  details: string;
  itemsFound?: number;
  itemsProcessed?: number;
  foundLabel?: string;
  processedLabel?: string;
  title?: string;
}

export const LoadingProgress = ({
  stages,
  currentStage,
  percentage,
  estimatedTimeRemaining,
  stageLabel,
  details,
  itemsFound,
  itemsProcessed,
  foundLabel = "encontrados",
  processedLabel = "processados",
  title = "Processando..."
}: LoadingProgressProps) => {
  const currentStageIndex = stages.findIndex(s => s.stage === currentStage);

  return (
    <Card className="p-6 space-y-4 bg-primary/5 border-primary/20 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground">
          ~{Math.ceil(estimatedTimeRemaining / 60)}min restante
        </span>
      </div>
      
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{percentage}% completo</span>
          <span>{estimatedTimeRemaining}s restantes</span>
        </div>
      </div>
      
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        {stages.map((s, i) => {
          const isActive = i === currentStageIndex;
          const isComplete = i < currentStageIndex;
          
          return (
            <div
              key={s.stage}
              className={`text-center p-3 rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 scale-105'
                  : isComplete
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          {stageLabel}
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          {details}
        </p>
      </div>
      
      {(itemsFound !== undefined || itemsProcessed !== undefined) && (
        <div className="flex gap-6 text-sm">
          {itemsFound !== undefined && (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{itemsFound}</span>
              <span className="text-muted-foreground">{foundLabel}</span>
            </div>
          )}
          {itemsProcessed !== undefined && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{itemsProcessed}</span>
              <span className="text-muted-foreground">{processedLabel}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
