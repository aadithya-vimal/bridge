import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserEditDialog } from "@/components/dashboard/UserEditDialog";
import { useAuth } from "@/hooks/use-auth";
import {
  CompanySettingsCard,
  RoleManagementCard,
  UserManagementCard,
  WorkspaceManagementCard,
  type UserSummary,
  type WorkspaceSummary,
} from "@/components/dashboard/admin/cards";
import {
  CompanyRequestsCard,
  RoleRequestsCard,
  WorkspaceRequestsCard,
} from "@/components/dashboard/admin/requests";
import { WorkspaceFeatureDialog } from "@/components/dashboard/admin/WorkspaceFeatureDialog";
import {
  defaultWorkspaceFeatures,
  workspaceFeatureDefinitions,
  type WorkspaceFeatureKey,
  type WorkspaceFeatureMap,
} from "@/components/dashboard/admin/constants";
import { Check, X } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const requests = useQuery(api.users.getRoleRequests);
  const resolveRequest = useMutation(api.users.resolveRoleRequest);
  const allUsers = useQuery(api.users.getAllUsers);
  const company = useQuery(api.companies.getMyCompany);
  
  const workspaceRequests = useQuery(api.workspaces.getRequests);
  const resolveWorkspaceRequest = useMutation(api.workspaces.resolveRequest);
  
  const companyRequests = useQuery(api.companies.getRequests);
  const resolveCompanyRequest = useMutation(api.companies.resolveRequest);

  const deleteUser = useMutation(api.users.deleteUser);
  const inviteUser = useMutation(api.companies.invite);
  const transferOwnership = useMutation(api.companies.transferOwnership);
  const deleteCompany = useMutation(api.companies.deleteCompany);
  const updateCompany = useMutation(api.companies.update);

  // Roles Management
  const roles = useQuery(api.roles.list);
  const createRole = useMutation(api.roles.create);
  const deleteRole = useMutation(api.roles.deleteRole);

  // Workspace Management
  const workspaces = useQuery(api.workspaces.list);
  const createWorkspace = useMutation(api.workspaces.create);
  const deleteWorkspace = useMutation(api.workspaces.deleteWorkspace);
  const updateWorkspaceFeatures = useMutation(api.workspaces.updateFeatures);

  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserSummary | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [deleteCompanyOpen, setDeleteCompanyOpen] = useState(false);
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (company) {
      setCompanyDescription(company.description || "");
      setCompanyName(company.name || "");
    }
  }, [company]);
  
  // Roles State
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  // Workspace State
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] = useState("general");
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Id<"workspaces"> | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceSummary | null>(null);
  const [workspaceFeatures, setWorkspaceFeatures] = useState<WorkspaceFeatureMap>({
    ...defaultWorkspaceFeatures,
  });
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  const handleResolve = async (requestId: Id<"role_requests">, approved: boolean) => {
    try {
      await resolveRequest({ requestId, approved });
      toast.success(approved ? "Request approved" : "Request rejected");
    } catch (error) {
      toast.error("Failed to resolve request");
    }
  };

  const handleResolveWorkspace = async (requestId: Id<"workspace_requests">, approved: boolean) => {
    try {
      await resolveWorkspaceRequest({ requestId, approved });
      toast.success(approved ? "Access granted" : "Access denied");
    } catch (error) {
      toast.error("Failed to resolve workspace request");
    }
  };

  const handleResolveCompany = async (requestId: Id<"company_requests">, approved: boolean) => {
    try {
      await resolveCompanyRequest({ requestId, approved });
      toast.success(approved ? "Request approved" : "Request rejected");
    } catch (error) {
      toast.error("Failed to resolve company request");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await deleteUser({ userId: deleteConfirmUser._id });
      toast.success("User deleted successfully");
      setDeleteConfirmUser(null);
      setSelectedUser(null); // Close edit modal if open
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await inviteUser({ email: inviteEmail });
      toast.success("Invitation sent");
      setInviteEmail("");
    } catch (error) {
      toast.error("Failed to send invitation. User must exist and not be in a company.");
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    setTransferConfirmOpen(true);
  };

  const confirmTransferOwnership = async () => {
    if (!newOwnerId) return;
    try {
      await transferOwnership({ newOwnerId: newOwnerId as Id<"users"> });
      toast.success("Ownership transferred");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to transfer ownership");
    }
  };

  const handleDeleteCompany = async () => {
    try {
      await deleteCompany();
      toast.success("Company deleted");
      window.location.href = "/dashboard/setup";
    } catch (error) {
      toast.error("Failed to delete company");
    }
  };

  const handleUpdateCompany = async () => {
    if (!company?._id) return;
    try {
      await updateCompany({ 
        companyId: company._id,
        description: companyDescription,
        name: companyName,
      });
      toast.success("Company profile updated");
    } catch (error) {
      toast.error("Failed to update company");
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName) return;
    try {
      await createRole({ name: newRoleName, description: newRoleDescription });
      toast.success("Role created");
      setNewRoleName("");
      setNewRoleDescription("");
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleDeleteRole = async (roleId: Id<"roles">) => {
    try {
      await deleteRole({ roleId });
      toast.success("Role deleted");
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName) return;
    try {
      await createWorkspace({
        name: newWorkspaceName,
        type: newWorkspaceType,
        features: { ...defaultWorkspaceFeatures },
      });
      toast.success("Workspace created");
      setNewWorkspaceName("");
    } catch (error) {
      toast.error("Failed to create workspace");
    }
  };

  const handleDeleteWorkspace = (id: Id<"workspaces">) => {
    setWorkspaceToDelete(id);
  };

  const handleManageWorkspace = (workspace: WorkspaceSummary) => {
    const existingFeatures = (workspace.features ?? {}) as Partial<Record<WorkspaceFeatureKey, boolean>>;
    setWorkspaceFeatures({
      ...defaultWorkspaceFeatures,
      ...existingFeatures,
    });
    setEditingWorkspace(workspace);
  };

  const handleFeatureToggle = (key: WorkspaceFeatureKey, value: boolean) => {
    setWorkspaceFeatures((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveWorkspaceFeatures = async () => {
    if (!editingWorkspace) return;
    try {
      await updateWorkspaceFeatures({
        workspaceId: editingWorkspace._id,
        features: workspaceFeatures,
      });
      toast.success("Workspace features updated");
      setEditingWorkspace(null);
      setWorkspaceFeatures({ ...defaultWorkspaceFeatures });
    } catch (error) {
      toast.error("Failed to update workspace features");
    }
  };

  const closeWorkspaceDialog = () => {
    setEditingWorkspace(null);
    setWorkspaceFeatures({ ...defaultWorkspaceFeatures });
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    try {
      await deleteWorkspace({ workspaceId: workspaceToDelete });
      toast.success("Workspace deleted");
      setWorkspaceToDelete(null);
    } catch (error) {
      toast.error("Failed to delete workspace");
    }
  };

  const isOwner = company?.ownerId === user?._id;
  const potentialOwners = (allUsers ?? []).filter((u) => u._id !== user?._id);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold text-white">Admin Controls</h1>

      {isOwner && (
        <CompanySettingsCard
          inviteEmail={inviteEmail}
          onInviteEmailChange={setInviteEmail}
          onInvite={handleInvite}
          newOwnerId={newOwnerId}
          onNewOwnerChange={setNewOwnerId}
          potentialOwners={potentialOwners}
          onRequestTransfer={handleTransferOwnership}
          companyName={companyName}
          onCompanyNameChange={setCompanyName}
          companyDescription={companyDescription}
          onCompanyDescriptionChange={setCompanyDescription}
          onUpdateCompany={handleUpdateCompany}
          onDeleteCompany={() => setDeleteCompanyOpen(true)}
        />
      )}

      <RoleManagementCard
        roles={roles}
        newRoleName={newRoleName}
        onRoleNameChange={setNewRoleName}
        newRoleDescription={newRoleDescription}
        onRoleDescriptionChange={setNewRoleDescription}
        onCreateRole={handleCreateRole}
        onDeleteRole={handleDeleteRole}
      />

      <WorkspaceManagementCard
        workspaces={workspaces}
        newWorkspaceName={newWorkspaceName}
        onNewWorkspaceNameChange={setNewWorkspaceName}
        newWorkspaceType={newWorkspaceType}
        onNewWorkspaceTypeChange={setNewWorkspaceType}
        onCreateWorkspace={handleCreateWorkspace}
        onManageWorkspace={handleManageWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      <WorkspaceFeatureDialog
        open={!!editingWorkspace}
        workspaceName={editingWorkspace?.name}
        workspaceFeatures={workspaceFeatures}
        onToggle={handleFeatureToggle}
        onClose={closeWorkspaceDialog}
        onSave={handleSaveWorkspaceFeatures}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <CompanyRequestsCard requests={companyRequests} onResolve={handleResolveCompany} />
        </div>
        <WorkspaceRequestsCard requests={workspaceRequests} onResolve={handleResolveWorkspace} />
        <RoleRequestsCard requests={requests} onResolve={handleResolve} />
        <div className="lg:col-span-2">
          <UserManagementCard users={allUsers} onEditUser={setSelectedUser} onDeleteUser={setDeleteConfirmUser} />
        </div>
      </div>

      {selectedUser && (
        <UserEditDialog user={selectedUser} open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)} />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the user
              <span className="font-bold text-white"> {deleteConfirmUser?.name || deleteConfirmUser?.email} </span>
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-rose-600 hover:bg-rose-700 text-white border-none">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Workspace Confirmation */}
      <AlertDialog open={!!workspaceToDelete} onOpenChange={(open) => !open && setWorkspaceToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the workspace and all associated access records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteWorkspace} className="bg-rose-600 hover:bg-rose-700 text-white border-none">
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Ownership Confirmation */}
      <AlertDialog open={transferConfirmOpen} onOpenChange={setTransferConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Ownership?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure? You will lose ownership and become an admin. This action cannot be undone by you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmTransferOwnership} className="bg-amber-600 hover:bg-amber-700 text-white border-none">
              Transfer Ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Company Confirmation */}
      <AlertDialog open={deleteCompanyOpen} onOpenChange={setDeleteCompanyOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete the company and remove all association with users.
              All users will be removed from the company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-rose-600 hover:bg-rose-700 text-white border-none">
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}