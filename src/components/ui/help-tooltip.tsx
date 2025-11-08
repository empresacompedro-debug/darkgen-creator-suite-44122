import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  title?: string;
  description: string;
  steps?: string[];
}

export function HelpTooltip({ title, description, steps }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-muted hover:bg-muted-foreground/20 transition-colors"
            aria-label="Ajuda"
          >
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="top">
          <div className="space-y-2">
            {title && <p className="font-semibold">{title}</p>}
            <p className="text-sm">{description}</p>
            {steps && steps.length > 0 && (
              <ol className="text-sm list-decimal list-inside space-y-1 mt-2">
                {steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
