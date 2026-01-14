import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { Building2, Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // Fixed import
import { toast } from "sonner";

export default function CompanySetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  
  const createCompany = useMutation(api.companies.create);
  const joinCompany = useMutation(api.companies.join);
  const companies = useQuery(api.companies.list);
  const myRequest = useQuery(api.companies.getMyRequest);
  const invitations = useQuery(api.companies.getInvitations);
  const acceptInvitation = useMutation(api.companies.acceptInvitation);
  const declineInvitation = useMutation(api.companies.declineInvitation);

  const pendingCompanyName = companies?.find(c => c._id === myRequest?.companyId)?.name;

  const handleCreate = async () => {
    if (!name) return;
    try {
      await createCompany({ name });
      toast.success("Company created!");
      window.location.reload(); 
    } catch (error) {
      toast.error("Failed to create company");
    }
  };

  const handleJoin = async (companyId: any) => {
    try {
      await joinCompany({ companyId });
      toast.success("Request sent!");
    } catch (error) {
      toast.error("Failed to send request");
    }
  };

  const handleAccept = async (requestId: any) => {
    try {
      await acceptInvitation({ requestId });
      toast.success("Invitation accepted!");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to accept invitation");
    }
  };

  const handleDecline = async (requestId: any) => {
    try {
      await declineInvitation({ requestId });
      toast.success("Invitation declined");
    } catch (error) {
      toast.error("Failed to decline invitation");
    }
  };

  if (user?.companyId) {
    navigate("/dashboard");
    return null;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCompanies = companies?.filter((company) => {
    if (!normalizedSearch) return true;
    return (company.name ?? "").toLowerCase().includes(normalizedSearch);
  });

  const defaultTab = searchParams.get("tab") === "create" ? "create" : "join";

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-500" />
            Setup Company
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Create a new organization or join an existing one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations && invitations.length > 0 && (
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Invitations</h3>
              {invitations.map((invite) => (
                <div key={invite._id} className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-sm text-zinc-200 mb-3">
                    You have been invited to join <span className="font-bold text-white">{invite.companyName}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 w-full" onClick={() => handleAccept(invite._id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-800 w-full" onClick={() => handleDecline(invite._id)}>
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
              <div className="h-px bg-zinc-800 my-4" />
            </div>
          )}

          {myRequest ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
              <div>
                <h3 className="font-medium text-white">Request Pending</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Waiting for approval to join <span className="text-white font-medium">{pendingCompanyName || "company"}</span>.
                </p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-950">
                <TabsTrigger value="join">Join Existing</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
              </TabsList>
              
              <TabsContent value="join" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search companies..."
                    className="pl-9 bg-zinc-950 border-zinc-800"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredCompanies?.map((company) => {
                    const displayName = company.name ?? "Untitled Company";
                    return (
                      <div key={company._id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-950 transition-colors">
                        <span className="font-medium">{displayName}</span>
                        <Button size="sm" variant="secondary" onClick={() => handleJoin(company._id)}>
                          Join
                        </Button>
                      </div>
                    );
                  })}
                  {filteredCompanies?.length === 0 && (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      No companies found.
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    placeholder="Acme Inc." 
                    className="bg-zinc-950 border-zinc-800"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Company
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}