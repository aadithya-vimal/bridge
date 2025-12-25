import { KanbanCard, Task } from "./KanbanCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGroup } from "framer-motion";

interface BoardProps {
  tasks: Task[];
  userRole?: string;
  onMoveTask?: (id: string, newStatus: string) => void;
  onEditTask?: (task: Task) => void;
}

const COLUMNS = [
  { id: "todo", label: "Backlog", color: "bg-zinc-500" },
  { id: "in-progress", label: "In Progress", color: "bg-indigo-500" },
  { id: "review", label: "Air-Lock", color: "bg-amber-500" },
  { id: "done", label: "Deployed", color: "bg-emerald-500" },
];

export function Board({ tasks, userRole, onMoveTask, onEditTask }: BoardProps) {
  return (
    <LayoutGroup>
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          
          return (
            <div key={col.id} className="min-w-[280px] w-[280px] flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="text-sm font-medium text-zinc-400">{col.label}</h3>
                </div>
                <span className="text-xs text-zinc-600 font-mono">{colTasks.length}</span>
              </div>
              
              <div className="flex-1 bg-zinc-900/20 rounded-xl border border-white/5 p-2">
                <ScrollArea className="h-full pr-2">
                  {colTasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700/50 gap-2">
                      <div className="w-12 h-1 border-2 border-dashed border-zinc-800 rounded-full" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Empty</span>
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <KanbanCard 
                      key={task._id} 
                      task={task} 
                      userRole={userRole} 
                      onMove={onMoveTask}
                      onEdit={onEditTask}
                    />
                  ))}
                </ScrollArea>
              </div>
            </div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}