import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PipelineWidgetProps {
  leads?: any[];
}

export function PipelineWidget({ leads }: PipelineWidgetProps) {
  const totalValue = leads?.reduce((acc, lead) => acc + (lead.value || 0), 0) || 0;
  const leadCount = leads?.length || 0;

  // Group leads by stage for the visualization
  const stages = leads?.reduce((acc: Record<string, number>, lead) => {
    const stage = lead.stage || "Unknown";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {}) || {};

  const sortedStages = Object.entries(stages).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(stages), 1);

  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">Pipeline Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(totalValue)}
            </div>
            <div className="text-xs text-zinc-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
              {leadCount} active opportunities
            </div>
          </div>
          
          {/* Dynamic Stage Distribution */}
          <div className="h-10 flex items-end gap-1">
            <TooltipProvider>
              {sortedStages.length > 0 ? (
                sortedStages.slice(0, 5).map(([stage, count], i) => (
                  <Tooltip key={stage}>
                    <TooltipTrigger asChild>
                      <div 
                        className="w-3 bg-indigo-500/40 hover:bg-indigo-500/60 rounded-t-sm transition-all cursor-help"
                        style={{ height: `${(count / maxCount) * 100}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-zinc-900 border-zinc-800 text-xs">
                      <p className="font-medium text-zinc-200">{stage}</p>
                      <p className="text-zinc-500">{count} leads</p>
                    </TooltipContent>
                  </Tooltip>
                ))
              ) : (
                <div className="h-full w-16 flex items-end justify-center pb-1">
                   <span className="text-[10px] text-zinc-700">No data</span>
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}