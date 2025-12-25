import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2, MoreVertical, Shield, ShieldAlert, ShieldCheck, User, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface WorkspaceMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: Id<"workspaces">;
  workspaceName: string;
}

export function WorkspaceMembersDialog({ isOpen, onClose, workspaceId, workspaceName }: WorkspaceMembersDialogProps) {
  const { user } = useAuth();
  const members = useQuery(api.workspaces.getMembers, { workspaceId });
  const myRole = useQuery(api.workspaces.getMyWorkspaceRole, { workspaceId });
  
  const updateRole = useMutation(api.workspaces.updateMemberRole);
  const revokeAccess = useMutation(api.workspaces.revokeAccess);

  const canManage = user?.role === "admin" || myRole === "admin";

  const handleRoleChange = async (memberId: Id<"users">, newRole: string) => {
    try {
      await updateRole({ workspaceId, memberId, role: newRole });
      toast.success("Role updated successfully");
    } catch (e) {
      toast.error("Failed to update role");
    }
  };

  const handleRemove = async (memberId: Id<"users">) => {
    try {
      await revokeAccess({ userId: memberId, workspace: workspaceId });
      toast.success("Member removed from workspace");
    } catch (e) {
      toast.error("Failed to remove member");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Members of {workspaceName}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[300px] pr-4">
          {members === undefined ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No members found in this workspace.
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-white/10">
                      <AvatarImage src={member.image} />
                      <AvatarFallback className="bg-zinc-800 text-xs">
                        {member.name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{member.name || "Unknown User"}</p>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-zinc-950 border-zinc-800 text-zinc-400 capitalize">
                      {member.role === "admin" ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                      {member.role || "Member"}
                    </Badge>

                    {canManage && member.userId !== user?._id && member.role !== "admin" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "admin")}>
                            <ShieldAlert className="w-4 h-4 mr-2" /> Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "member")}>
                            <ShieldCheck className="w-4 h-4 mr-2" /> Make Member
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-500 focus:text-rose-500" onClick={() => handleRemove(member.userId)}>
                            <X className="w-4 h-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}