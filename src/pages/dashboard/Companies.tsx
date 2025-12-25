import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { Building2, Globe, Search, Users, ArrowRight, Clock, ShieldCheck, User, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function CompaniesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const companies = useQuery(api.companies.list);
  const myRequest = useQuery(api.companies.getMyRequest);
  const joinCompany = useMutation(api.companies.join);
  const [search, setSearch] = useState("");
  const [showCreateAlert, setShowCreateAlert] = useState(false);

  const filteredCompanies = companies?.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = async (companyId: Id<"companies">) => {
    try {
      await joinCompany({ companyId });
      toast.success("Join request sent successfully");
    } catch (error) {
      toast.error("Failed to send join request");
    }
  };

  const handleCreateClick = () => {
    if (user?.companyId) {
      setShowCreateAlert(true);
    } else {
      navigate("/dashboard/setup?tab=create");
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Directory</h1>
          <p className="text-zinc-400">Browse and join companies on Bridge OS.</p>
        </div>
        <Button 
          onClick={handleCreateClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Company
        </Button>
      </div>

      <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search companies..."
              className="pl-9 bg-zinc-950 border-zinc-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies === undefined ? (
               <div className="col-span-full text-center py-12 text-zinc-500">Loading...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="col-span-full text-center py-12 text-zinc-500">
                No companies found matching your search.
              </div>
            ) : (
              filteredCompanies.map((company) => {
                const isMyCompany = user?.companyId === company._id;
                const isPending = myRequest?.companyId === company._id;
                
                return (
                  <div 
                    key={company._id} 
                    className={`flex flex-col p-5 rounded-xl border transition-all duration-200 ${
                      isMyCompany 
                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]' 
                        : 'bg-zinc-950/50 border-white/5 hover:border-white/10 hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-lg border ${isMyCompany ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-zinc-900 border-white/5'}`}>
                        <Building2 className={`w-6 h-6 ${isMyCompany ? 'text-indigo-400' : 'text-zinc-400'}`} />
                      </div>
                      {isMyCompany && (
                        <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20">
                          Current Company
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">
                          Request Pending
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{company.name || "Untitled Company"}</h3>
                      <p className="text-sm text-zinc-400 mb-4 min-h-[2.5rem] line-clamp-2">
                        {company.description || "No description provided for this company."}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-zinc-500 mb-6">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Public</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{company.memberCount} Members</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="truncate">Owner: {company.ownerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(company._creationTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {!user?.companyId && !isPending && !isMyCompany && (
                      <Button 
                        className="w-full mt-auto bg-white/5 hover:bg-white/10 text-white border border-white/5"
                        onClick={() => handleJoin(company._id)}
                      >
                        Request to Join
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    
                    {isMyCompany && (
                      <div className="mt-auto pt-4 border-t border-indigo-500/20 flex items-center justify-center text-sm text-indigo-300 font-medium">
                        You are a member
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCreateAlert} onOpenChange={setShowCreateAlert}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Already in a Company</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You are currently a member of a company. You must leave your current company before you can create a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowCreateAlert(false);
                // Trigger leave company flow from layout if possible, or just navigate to dashboard where they can leave
                // Since we can't easily trigger the layout's leave modal, we'll just tell them to use the dropdown
                toast.info("Please use the user menu in the sidebar to leave your company.");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-none"
            >
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}