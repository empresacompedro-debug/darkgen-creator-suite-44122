import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScriptAnalysis {
  overall: number;
  retention: number;
  clarity: number;
  viral: number;
  weaknesses: Array<{
    part: string;
    issue: string;
    suggestion: string;
  }>;
  improvements: string;
}

interface ScriptAnalysisCardProps {
  analysis: ScriptAnalysis;
}

export const ScriptAnalysisCard = ({ analysis }: ScriptAnalysisCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-600";
    if (score >= 75) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card className="p-6 shadow-soft border-2 border-accent/20">
      <h3 className="text-2xl font-bold mb-6">Análise do Roteiro</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Pontuação Geral</span>
            <span className={`text-3xl font-bold ${getScoreColor(analysis.overall)}`}>
              {analysis.overall}/100
            </span>
          </div>
          <Progress value={analysis.overall} className={getProgressColor(analysis.overall)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Potencial de Retenção</span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.retention)}`}>
              {analysis.retention}/100
            </span>
          </div>
          <Progress value={analysis.retention} className={getProgressColor(analysis.retention)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Clareza da Mensagem</span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.clarity)}`}>
              {analysis.clarity}/100
            </span>
          </div>
          <Progress value={analysis.clarity} className={getProgressColor(analysis.clarity)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Potencial Viral</span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.viral)}`}>
              {analysis.viral}/100
            </span>
          </div>
          <Progress value={analysis.viral} className={getProgressColor(analysis.viral)} />
        </div>
      </div>

      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-bold text-lg">Pontos de Melhoria:</h4>
          {analysis.weaknesses.map((weakness, index) => (
            <div key={index} className="p-4 bg-muted rounded-lg space-y-2">
              <div className="font-semibold text-destructive">{weakness.part}</div>
              <div className="text-sm">
                <span className="font-medium">Problema:</span> {weakness.issue}
              </div>
              <div className="text-sm text-primary">
                <span className="font-medium">Sugestão:</span> {weakness.suggestion}
              </div>
            </div>
          ))}
        </div>
      )}

      {analysis.improvements && (
        <div className="mt-6 p-4 bg-accent/10 rounded-lg">
          <h4 className="font-bold mb-2">Sugestões Gerais:</h4>
          <p className="text-sm whitespace-pre-line">{analysis.improvements}</p>
        </div>
      )}
    </Card>
  );
};
