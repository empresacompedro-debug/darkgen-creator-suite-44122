import { useState, useCallback, useRef } from "react";

export interface LoadingProgressState {
  stage: string;
  stageLabel: string;
  percentage: number;
  itemsFound: number;
  itemsProcessed: number;
  estimatedTimeRemaining: number;
  details: string;
}

export interface StageConfig {
  stage: string;
  label: string;
  duration: number;
  percentage: number;
  details: string;
}

export const useLoadingProgress = (stages: StageConfig[]) => {
  const [progress, setProgress] = useState<LoadingProgressState>({
    stage: '',
    stageLabel: '',
    percentage: 0,
    itemsFound: 0,
    itemsProcessed: 0,
    estimatedTimeRemaining: 0,
    details: ''
  });

  const intervalRef = useRef<number | null>(null);
  const stageIndexRef = useRef(0);
  const startTimeRef = useRef(0);

  const startProgress = useCallback(() => {
    stageIndexRef.current = 0;
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      if (stageIndexRef.current >= stages.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const currentStage = stages[stageIndexRef.current];
      const elapsed = Date.now() - startTimeRef.current;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);
      const previousPercentage = stageIndexRef.current > 0 ? stages[stageIndexRef.current - 1].percentage : 0;
      const currentPercentage = previousPercentage + (currentStage.percentage - previousPercentage) * stageProgress;

      const remainingStages = stages.slice(stageIndexRef.current);
      const totalRemainingTime = remainingStages.reduce((sum, s, i) => {
        if (i === 0) return sum + (s.duration * (1 - stageProgress));
        return sum + s.duration;
      }, 0);

      setProgress({
        stage: currentStage.stage,
        stageLabel: currentStage.label,
        percentage: Math.round(currentPercentage),
        itemsFound: stageIndexRef.current >= 1 ? Math.min(50 + stageIndexRef.current * 100, 500) : 0,
        itemsProcessed: stageIndexRef.current >= 2 ? Math.min(10 + stageIndexRef.current * 30, 200) : 0,
        estimatedTimeRemaining: Math.round(totalRemainingTime / 1000),
        details: currentStage.details
      });

      if (stageProgress >= 1) {
        stageIndexRef.current++;
        startTimeRef.current = Date.now();
      }
    };

    intervalRef.current = window.setInterval(updateProgress, 200);
  }, [stages]);

  const stopProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress({
      stage: '',
      stageLabel: '',
      percentage: 0,
      itemsFound: 0,
      itemsProcessed: 0,
      estimatedTimeRemaining: 0,
      details: ''
    });
  }, []);

  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress({
      stage: 'complete',
      stageLabel: 'Concluído',
      percentage: 100,
      itemsFound: 0,
      itemsProcessed: 0,
      estimatedTimeRemaining: 0,
      details: 'Processo finalizado com sucesso!'
    });
  }, []);

  return {
    progress,
    startProgress,
    stopProgress,
    completeProgress,
    isActive: intervalRef.current !== null
  };
};
