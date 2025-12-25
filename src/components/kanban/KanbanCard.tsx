import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Play, Rocket } from "lucide-react";

export interface Task {
  _id: string;
  title: string;
  status: string;
  velocity_forecast: number;
  is_locked: boolean;
  assignee?: string;
}

interface KanbanCardProps {
  task: Task;
  userRole?: string;
  onMove?: (id: string, newStatus: string) => void;
  onEdit?: (task: Task) => void;
}

export function KanbanCard({ task, userRole = "employee", onMove, onEdit }: KanbanCardProps) {
  const isReview = task.status === "review";
  const isTodo = task.status === "todo";
  const isInProgress = task.status === "in-progress";
  
  const isAdmin = userRole === "admin";
  const isLocked = isReview && task.is_locked && !isAdmin;

  return (
    <motion.div
      layout
      layoutId={task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className="mb-3"
      onClick={(e) => {
        // Prevent triggering edit when clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        onEdit?.(task);
      }}
    >
      <Card className="p-4 bg-zinc-900/40 border-zinc-800/60 backdrop-blur-sm hover:border-zinc-700/80 transition-colors group cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 border-0",
              task.velocity_forecast > 8 ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
            )}
          >
            {task.velocity_forecast} pts
          </Badge>
          {task.is_locked && <Lock className={cn("w-3 h-3", isLocked ? "text-rose-500" : "text-zinc-600")} />}
        </div>
        
        <h4 className="text-sm font-medium text-zinc-200 mb-4 leading-snug">{task.title}</h4>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] text-indigo-300">
              JD
            </div>
          </div>

          {/* Action Buttons based on Status */}
          <div className="flex gap-1">
            {isTodo && (
              <Button 
                size="sm" 
                className="h-7 px-2 text-xs bg-zinc-800 text-zinc-400 hover:bg-indigo-500/20 hover:text-indigo-400 border border-transparent hover:border-indigo-500/20"
                onClick={() => onMove?.(task._id, "in-progress")}
              >
                <Play className="w-3 h-3 mr-1.5" />
                Start
              </Button>
            )}

            {isInProgress && (
              <Button 
                size="sm" 
                className="h-7 px-2 text-xs bg-zinc-800 text-zinc-400 hover:bg-amber-500/20 hover:text-amber-400 border border-transparent hover:border-amber-500/20"
                onClick={() => onMove?.(task._id, "review")}
              >
                <ArrowRight className="w-3 h-3 mr-1.5" />
                Review
              </Button>
            )}

            {isReview && (
              isLocked ? (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-2 text-xs bg-rose-500/10 text-rose-500 cursor-not-allowed hover:bg-rose-500/10 hover:text-rose-500 border border-rose-500/20"
                  disabled
                >
                  <Lock className="w-3 h-3 mr-1.5" />
                  Locked
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="h-7 px-2 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  onClick={() => onMove?.(task._id, "done")}
                >
                  <Rocket className="w-3 h-3 mr-1.5" />
                  Deploy
                </Button>
              )
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}