import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { workspaceFeatureDefinitions } from "./constants";
import type { WorkspaceFeatureKey, WorkspaceFeatureMap } from "./constants";

type WorkspaceFeatureDialogProps = {
  open: boolean;
  workspaceName?: string;
  workspaceFeatures: WorkspaceFeatureMap;
  onToggle: (key: WorkspaceFeatureKey, value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
};

export function WorkspaceFeatureDialog({
  open,
  workspaceName,
  workspaceFeatures,
  onToggle,
  onClose,
  onSave,
}: WorkspaceFeatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) onClose();
    }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Configure Workspace Modules</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {workspaceName ? `Adjust the tools available inside ${workspaceName}.` : "Activate or deactivate modules for this workspace."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {workspaceFeatureDefinitions.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{feature.label}</p>
                <p className="text-xs text-zinc-500">{feature.description}</p>
              </div>
              <Switch
                checked={workspaceFeatures[feature.key]}
                onCheckedChange={(value) => onToggle(feature.key, value)}
              />
            </div>
          ))}
        </div>
        <DialogFooter className="pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-700">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
