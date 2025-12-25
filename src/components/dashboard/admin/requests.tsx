import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Building2, Check, X } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export type CompanyRequest = {
  _id: Id<"company_requests">;
  requesterName: string;
  requesterEmail?: string;
  status: string;
};

export type WorkspaceAccessRequest = {
  _id: Id<"workspace_requests">;
  requesterName: string;
  requesterEmail?: string;
  workspaceName?: string | null;
};

export type RoleRequest = {
  _id: Id<"role_requests">;
  requesterName: string;
  requesterEmail?: string;
  requestedRole?: string;
  customRoleName?: string;
  reason?: string | null;
};

type CompanyRequestsCardProps = {
  requests: CompanyRequest[] | undefined;
  onResolve: (requestId: Id<"company_requests">, approved: boolean) => void;
};

export function CompanyRequestsCard({ requests, onResolve }: CompanyRequestsCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          Company Join Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500">User</TableHead>
              <TableHead className="text-zinc-500">Email</TableHead>
              <TableHead className="text-zinc-500">Status</TableHead>
              <TableHead className="text-right text-zinc-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests === undefined ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500">
                  No pending requests
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-zinc-200">{req.requesterName}</TableCell>
                  <TableCell className="text-zinc-400">{req.requesterEmail ?? "Unknown"}</TableCell>
                  <TableCell className="text-zinc-400 capitalize">{req.status}</TableCell>
                  <TableCell className="text-right">
                    {req.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => onResolve(req._id, true)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                          onClick={() => onResolve(req._id, false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Invited</span>
                    )}
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

type WorkspaceRequestsCardProps = {
  requests: WorkspaceAccessRequest[] | undefined;
  onResolve: (requestId: Id<"workspace_requests">, approved: boolean) => void;
};

export function WorkspaceRequestsCard({ requests, onResolve }: WorkspaceRequestsCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Workspace Access Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500">User</TableHead>
              <TableHead className="text-zinc-500">Workspace</TableHead>
              <TableHead className="text-right text-zinc-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests === undefined ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-500">
                  No pending requests
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-zinc-200">
                    <div>{req.requesterName}</div>
                    <div className="text-xs text-zinc-500">{req.requesterEmail ?? "Unknown"}</div>
                  </TableCell>
                  <TableCell className="text-zinc-300 capitalize">{req.workspaceName || "Unknown"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => onResolve(req._id, true)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                        onClick={() => onResolve(req._id, false)}
                      >
                        <X className="w-4 h-4" />
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

type RoleRequestsCardProps = {
  requests: RoleRequest[] | undefined;
  onResolve: (requestId: Id<"role_requests">, approved: boolean) => void;
};

export function RoleRequestsCard({ requests, onResolve }: RoleRequestsCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Role Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-zinc-500">User</TableHead>
              <TableHead className="text-zinc-500">Requested Role</TableHead>
              <TableHead className="text-zinc-500">Reason</TableHead>
              <TableHead className="text-right text-zinc-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests === undefined ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500">
                  No pending requests
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-zinc-200">
                    <div>{req.requesterName}</div>
                    <div className="text-xs text-zinc-500">{req.requesterEmail ?? "Unknown"}</div>
                  </TableCell>
                  <TableCell className="text-zinc-300 capitalize">
                    {req.customRoleName || req.requestedRole || "Unknown"}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm max-w-[200px] truncate" title={req.reason || ""}>
                    {req.reason || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => onResolve(req._id, true)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                        onClick={() => onResolve(req._id, false)}
                      >
                        <X className="w-4 h-4" />
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