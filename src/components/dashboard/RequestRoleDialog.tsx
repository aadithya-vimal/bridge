import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface RequestRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestRoleDialog({ isOpen, onClose }: RequestRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const requestRole = useMutation(api.users.requestRole);
  const roles = useQuery(api.roles.list);

  const handleSubmit = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      // Check if it's a system role or custom role
      const isSystemRole = ["employee", "client"].includes(selectedRole);
      
      await requestRole({ 
        role: isSystemRole ? (selectedRole as "employee" | "client") : undefined,
        customRoleId: !isSystemRole ? (selectedRole as Id<"roles">) : undefined,
        reason 
      });
      
      toast.success("Role request submitted successfully");
      onClose();
      setReason("");
      setSelectedRole("employee");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Role Change</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Submit a request to change your role within the company. An admin will review your request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Requested Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="employee">Employee (System)</SelectItem>
                <SelectItem value="client">Client (System)</SelectItem>
                {roles?.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Reason for Request</Label>
            <Textarea 
              placeholder="Why do you need this role?"
              className="bg-zinc-950 border-zinc-800 min-h-[100px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}