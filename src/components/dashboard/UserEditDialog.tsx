import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface UserEditDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditDialog({ user, open, onOpenChange }: UserEditDialogProps) {
  const updateUser = useMutation(api.users.updateUser);
  const roles = useQuery(api.roles.list);
  
  const [role, setRole] = useState(user.role || "employee");
  const [customRoleId, setCustomRoleId] = useState<string>(user.customRoleId || "none");
  const [department, setDepartment] = useState(user.department || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role || "employee");
      setCustomRoleId(user.customRoleId || "none");
      setDepartment(user.department || "");
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUser({
        userId: user._id,
        role,
        customRoleId: customRoleId === "none" ? undefined : (customRoleId as Id<"roles">),
        department,
      });
      toast.success("User updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update role and details for {user.name || user.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right text-zinc-400">
              System Role
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="col-span-3 bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customRole" className="text-right text-zinc-400">
              Company Role
            </Label>
            <Select value={customRoleId} onValueChange={setCustomRoleId}>
              <SelectTrigger className="col-span-3 bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Select company role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="none">None</SelectItem>
                {roles?.map((r) => (
                  <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right text-zinc-400">
              Department
            </Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="col-span-3 bg-zinc-950 border-zinc-800"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}