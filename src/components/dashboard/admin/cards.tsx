import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, Briefcase, Plus, Trash2, Settings, Edit } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { defaultWorkspaceFeatures, workspaceFeatureDefinitions } from "./constants";
import type { WorkspaceFeatureKey } from "./constants";

export type UserSummary = {
  _id: Id<"users">;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  customRoleName?: string | null;
  department?: string | null;
};

export type WorkspaceSummary = {
  _id: Id<"workspaces">;
  name: string;
  type: string;
  features?: Partial<Record<WorkspaceFeatureKey, boolean>> | null;
};

type CompanySettingsCardProps = {
  inviteEmail: string;
  onInviteEmailChange: (value: string) => void;
  onInvite: () => void;
  newOwnerId: string;
  onNewOwnerChange: (value: string) => void;
  potentialOwners: UserSummary[];
  onRequestTransfer: () => void;
  companyName: string;
  onCompanyNameChange: (value: string) => void;
  companyDescription: string;
  onCompanyDescriptionChange: (value: string) => void;
  onUpdateCompany: () => void;
  onDeleteCompany: () => void;
};

export function CompanySettingsCard({
  inviteEmail,
  onInviteEmailChange,
  onInvite,
  newOwnerId,
  onNewOwnerChange,
  potentialOwners,
  onRequestTransfer,
  companyName,
  onCompanyNameChange,
  companyDescription,
  onCompanyDescriptionChange,
  onUpdateCompany,
  onDeleteCompany,
}: CompanySettingsCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" />
          Company Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label>Invite User by Email</Label>
            <div className="flex gap-2">
              <Input
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => onInviteEmailChange(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
              />
              <Button onClick={onInvite} className="bg-indigo-600 hover:bg-indigo-700">
                Invite
              </Button>
            </div>
            <p className="text-xs text-zinc-500">User must already have an account on the platform.</p>
          </div>

          <div className="space-y-2">
            <Label>Transfer Ownership</Label>
            <div className="flex gap-2">
              <Select value={newOwnerId} onValueChange={onNewOwnerChange}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Select new owner..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {potentialOwners.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={onRequestTransfer}
                variant="outline"
                className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                Transfer
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company Description</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Brief description of your company..."
              value={companyDescription}
              onChange={(e) => onCompanyDescriptionChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
            <Button onClick={onUpdateCompany} variant="secondary">
              Update
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <Button
            variant="destructive"
            onClick={onDeleteCompany}
            className="bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-800"
          >
            Delete Company
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type RoleManagementCardProps = {
  roles: Array<{ _id: Id<"roles">; name: string; description?: string | null }> | undefined;
  newRoleName: string;
  onRoleNameChange: (value: string) => void;
  newRoleDescription: string;
  onRoleDescriptionChange: (value: string) => void;
  onCreateRole: () => void;
  onDeleteRole: (roleId: Id<"roles">) => void;
};

export function RoleManagementCard({
  roles,
  newRoleName,
  onRoleNameChange,
  newRoleDescription,
  onRoleDescriptionChange,
  onCreateRole,
  onDeleteRole,
}: RoleManagementCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Role Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label>Role Name</Label>
            <Input
              placeholder="e.g. Senior Developer"
              value={newRoleName}
              onChange={(e) => onRoleNameChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>
          <div className="space-y-2 flex-[2]">
            <Label>Description</Label>
            <Input
              placeholder="Role responsibilities..."
              value={newRoleDescription}
              onChange={(e) => onRoleDescriptionChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>
          <Button onClick={onCreateRole} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500">Role Name</TableHead>
              <TableHead className="text-zinc-500">Description</TableHead>
              <TableHead className="text-right text-zinc-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-500">
                  No custom roles defined
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-zinc-200">{role.name}</TableCell>
                  <TableCell className="text-zinc-400">{role.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                      onClick={() => onDeleteRole(role._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type WorkspaceManagementCardProps = {
  workspaces: WorkspaceSummary[] | undefined;
  newWorkspaceName: string;
  onNewWorkspaceNameChange: (value: string) => void;
  newWorkspaceType: string;
  onNewWorkspaceTypeChange: (value: string) => void;
  onCreateWorkspace: () => void;
  onManageWorkspace: (workspace: WorkspaceSummary) => void;
  onDeleteWorkspace: (workspaceId: Id<"workspaces">) => void;
};

export function WorkspaceManagementCard({
  workspaces,
  newWorkspaceName,
  onNewWorkspaceNameChange,
  newWorkspaceType,
  onNewWorkspaceTypeChange,
  onCreateWorkspace,
  onManageWorkspace,
  onDeleteWorkspace,
}: WorkspaceManagementCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          Workspace Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label>Workspace Name</Label>
            <Input
              placeholder="e.g. Marketing"
              value={newWorkspaceName}
              onChange={(e) => onNewWorkspaceNameChange(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>
          <div className="space-y-2 w-[200px]">
            <Label>Type</Label>
            <Select value={newWorkspaceType} onValueChange={onNewWorkspaceTypeChange}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                {[
                  "general",
                  "engineering",
                  "product",
                  "design",
                  "marketing",
                  "sales",
                  "finance",
                  "hr",
                  "operations",
                  "legal",
                  "support",
                  "data",
                  "security",
                  "executive",
                  "logistics",
                  "research",
                  "events",
                  "content",
                  "strategy",
                  "web",
                  "growth",
                  "creative",
                  "clients",
                ].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "hr" ? "Human Resources" : type.replace(/^\w/, (c) => c.toUpperCase()).replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onCreateWorkspace} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500">Name</TableHead>
              <TableHead className="text-zinc-500">Type</TableHead>
              <TableHead className="text-zinc-500">Enabled Modules</TableHead>
              <TableHead className="text-right text-zinc-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces === undefined ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : workspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500">
                  No workspaces found
                </TableCell>
              </TableRow>
            ) : (
              workspaces.map((ws) => (
                <TableRow key={ws._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-zinc-200">{ws.name}</TableCell>
                  <TableCell className="text-zinc-400 capitalize">{ws.type}</TableCell>
                  <TableCell className="text-zinc-300">
                    <div className="flex flex-wrap gap-2">
                      {workspaceFeatureDefinitions
                        .filter(({ key }) => ws.features?.[key] ?? defaultWorkspaceFeatures[key])
                        .map(({ key, label }) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="border-indigo-500/40 text-indigo-300 bg-indigo-500/10"
                          >
                            {label}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-indigo-400 hover:text-white hover:bg-indigo-500/10"
                        onClick={() => onManageWorkspace(ws)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                        onClick={() => onDeleteWorkspace(ws._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type UserManagementCardProps = {
  users: UserSummary[] | undefined;
  onEditUser: (user: UserSummary) => void;
  onDeleteUser: (user: UserSummary) => void;
};

export function UserManagementCard({ users, onEditUser, onDeleteUser }: UserManagementCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500">Name</TableHead>
              <TableHead className="text-zinc-500">Email</TableHead>
              <TableHead className="text-zinc-500">Role</TableHead>
              <TableHead className="text-zinc-500">Department</TableHead>
              <TableHead className="text-right text-zinc-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users === undefined ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-zinc-200">{u.name || "Anonymous"}</TableCell>
                  <TableCell className="text-zinc-400">{u.email ?? "Not provided"}</TableCell>
                  <TableCell className="text-zinc-300 capitalize">
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={`w-fit ${
                          u.role === "admin"
                            ? "border-rose-500/50 text-rose-400 bg-rose-500/10"
                            : u.role === "client"
                            ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                            : "border-indigo-500/50 text-indigo-400 bg-indigo-500/10"
                        }`}
                      >
                        {u.role || "employee"}
                      </Badge>
                      {u.customRoleName && (
                        <Badge className="w-fit border-purple-500/50 text-purple-400 bg-purple-500/10" variant="outline">
                          {u.customRoleName}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">{u.department || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                        onClick={() => onEditUser(u)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {u.role !== "admin" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                          onClick={() => onDeleteUser(u)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}