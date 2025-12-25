import { Board } from "@/components/kanban/Board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ShieldAlert, ShieldCheck, Lock, ArrowRight, LayoutGrid, Globe, BarChart3, Users, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { TaskModal, LeadModal, TicketModal, ResolveTicketModal } from "./Modals";
import { PipelineWidget } from "@/components/dashboard/PipelineWidget";
import { AssetWidget } from "@/components/dashboard/AssetWidget";
import { SentimentWidget } from "@/components/dashboard/SentimentWidget";
import { CrmTable } from "@/components/dashboard/CrmTable";
import { useLocation, useNavigate, useParams } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementsWidget } from "@/components/dashboard/AnnouncementsWidget";
import { WorkspaceMembersDialog } from "@/components/dashboard/WorkspaceMembersDialog";
import { ChatArea } from "@/components/dashboard/ChatArea";

type WorkspaceFeatures = {
  chat: boolean;
  files: boolean;
  kanban: boolean;
  crm: boolean;
  analytics: boolean;
  announcements: boolean;
  support: boolean;
};

const DEFAULT_WORKSPACE_FEATURES: WorkspaceFeatures = {
  chat: true,
  files: true,
  kanban: true,
  crm: true,
  analytics: true,
  announcements: true,
  support: true,
};

const GENERAL_LAYOUT_TYPES: readonly string[] = [
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
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  
  // Modal States
  const [taskModal, setTaskModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: any }>({ open: false, mode: "create" });
  const [leadModal, setLeadModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: any }>({ open: false, mode: "create" });
  const [ticketModal, setTicketModal] = useState<{ open: boolean; mode: "create" | "edit" | "resolve"; data?: any }>({ open: false, mode: "create" });
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  const shouldFetch = isAuthenticated && !authLoading;
  const tasks = useQuery(api.tasks.get, shouldFetch ? {} : "skip");
  const leads = useQuery(api.leads.get, shouldFetch ? {} : "skip");
  const tickets = useQuery(api.tickets.get, shouldFetch ? {} : "skip");
  const updateTaskStatus = useMutation(api.tasks.updateStatus);
  
  // Workspace Access
  const myAccess = useQuery(api.workspaces.getMyAccess) || [];
  const myRequests = useQuery(api.workspaces.getMyRequests) || [];
  const allWorkspacesStatus = useQuery(api.workspaces.getAllWorkspacesStatus);
  const requestAccess = useMutation(api.workspaces.requestAccess);
  
  // Fetch current workspace details if ID is present
  const currentWorkspaceData = useQuery(api.workspaces.get, workspaceId ? { workspaceId } : "skip");

  const workspaceFeatures: WorkspaceFeatures = {
    ...DEFAULT_WORKSPACE_FEATURES,
    ...(currentWorkspaceData?.features ?? {}),
  };

  const renderModuleDisabled = (label: string, heightClass = "h-[200px]") => (
    <div
      className={`${heightClass} rounded-xl border border-white/5 bg-zinc-900/20 flex items-center justify-center text-sm text-zinc-500`}
    >
      {label} module disabled for this workspace.
    </div>
  );

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    const task = tasks?.find(t => t._id === taskId);
    const statusLabels: Record<string, string> = {
      "todo": "Backlog",
      "in-progress": "In Progress",
      "review": "Air-Lock",
      "done": "Deployed"
    };

    try {
      await updateTaskStatus({ 
        taskId: taskId as Id<"tasks">, 
        status: newStatus 
      });
      
      toast.success(`Task moved to ${statusLabels[newStatus]}`, {
        description: task?.title,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to update task status", {
        description: errorMessage
      });
      console.error(error);
    }
  };

  const isDashboardHome = location.pathname === "/dashboard";
  
  // Determine layout based on workspace type
  const workspaceType = currentWorkspaceData?.type || "general";
  const isWeb = workspaceType === "web";
  const isGrowth = workspaceType === "growth";
  const isCreative = workspaceType === "creative";
  const isClients = workspaceType === "clients";
  const isGeneral = GENERAL_LAYOUT_TYPES.includes(workspaceType);

  const workspaceName = currentWorkspaceData?.name || "Dashboard";
  
  // Check access
  const hasAccess = workspaceId ? myAccess.includes(workspaceId) : true;
  const hasPendingRequest = workspaceId ? myRequests.some(r => r.workspace === workspaceId) : false;

  const handleRequestAccess = async (wsId: string) => {
    try {
      await requestAccess({ workspace: wsId });
      toast.success("Access requested", { description: "Admin will review your request." });
    } catch (error) {
      toast.error("Failed to request access");
    }
  };

  // Derived Data
  const totalRevenue = leads?.reduce((acc, lead) => acc + (lead.value || 0), 0) || 0;
  const avgDealSize = leads?.length ? totalRevenue / leads.length : 0;

  const activeTasks = tasks?.filter(t => t.status === "in-progress") || [];
  
  const clientHealth = tickets ? Object.entries(tickets.reduce((acc: Record<string, { total: number; count: number }>, ticket) => {
    const clientId = ticket.client_id || "Unknown";
    const sentiment = ticket.sentiment_score ?? 50;
    if (!acc[clientId]) acc[clientId] = { total: 0, count: 0 };
    acc[clientId].total += sentiment;
    acc[clientId].count += 1;
    return acc;
  }, {})).map(([name, data]) => ({
    name,
    score: Math.round(data.total / data.count)
  })).sort((a, b) => b.score - a.score).slice(0, 5) : [];

  const currentDate = new Date();
  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  const sprintName = `Sprint ${getWeekNumber(currentDate)}`;
  const dateRange = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()} - ${new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short' })} ${new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).getDate()}`;

  // --- Dashboard Home View ---
  if (isDashboardHome) {
    return (
      <div className="space-y-8 max-w-[1200px] mx-auto pt-4 md:pt-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Welcome to BRIDGE</h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto px-4">
            Select a workspace to continue. You may need to request access if you haven't been added to a specific team yet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {allWorkspacesStatus === undefined ? (
             <div className="col-span-2 flex justify-center py-12">
               <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
             </div>
          ) : allWorkspacesStatus.length === 0 ? (
             <div className="col-span-2 text-center py-12 text-zinc-500">
               No workspaces found. Ask an admin to create one.
             </div>
          ) : (
            allWorkspacesStatus.map((ws) => {
              const icons: Record<string, any> = {
                web: Globe,
                growth: BarChart3,
                creative: LayoutGrid,
                clients: Users,
                general: Briefcase
              };
              const Icon = icons[ws.type] || Briefcase;
              
              return (
                <Card key={ws.id} className="bg-zinc-900/40 border-white/5 hover:border-white/10 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      {ws.status === "member" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Member</Badge>}
                      {ws.status === "pending" && <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Pending</Badge>}
                      {ws.status === "none" && <Badge variant="outline" className="text-zinc-500 border-zinc-800">No Access</Badge>}
                    </div>
                    <CardTitle className="mt-4 text-xl text-white">{ws.label}</CardTitle>
                    <CardDescription>
                      Access the {ws.label} workspace tools and data.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    {ws.status === "member" ? (
                      <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={() => navigate(`/dashboard/workspace/${ws.id}`)}>
                        Enter Workspace <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : ws.status === "pending" ? (
                      <Button disabled className="w-full bg-zinc-800 text-zinc-400">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Request Pending
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                        onClick={() => handleRequestAccess(ws.id)}
                      >
                        Request Access
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- Restricted Access View ---
  if (!hasAccess && workspaceId) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center p-4 md:p-6">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Restricted Workspace</h2>
        <p className="text-zinc-400 max-w-md mb-8">
          You do not have access to the {workspaceName} workspace. You can request access from an administrator.
        </p>
        {hasPendingRequest ? (
          <Button disabled className="bg-zinc-800 text-zinc-400">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Request Pending
          </Button>
        ) : (
          <Button onClick={() => handleRequestAccess(workspaceId)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Request Access
          </Button>
        )}
        <Button variant="link" className="mt-4 text-zinc-500" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* User Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{workspaceName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400 mt-1">
            <span className="font-medium text-zinc-300">{user?.name || "User"}</span>
            <span className="w-1 h-1 bg-zinc-600 rounded-full" />
            <span className="capitalize">{user?.role || "Employee"}</span>
            <span className="w-1 h-1 bg-zinc-600 rounded-full" />
            <span className="text-zinc-500">Access Granted</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800"
            onClick={() => setMembersModalOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Members
          </Button>
        </div>
      </div>

      {/* General Layout */}
      {isGeneral && (
        <div className="space-y-6">
          {(workspaceFeatures.announcements || workspaceFeatures.files || workspaceFeatures.chat) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workspaceFeatures.announcements && (
                <AnnouncementsWidget userRole={user?.role} />
              )}
              {workspaceFeatures.files && <AssetWidget />}
              {workspaceFeatures.chat && (
                <div className="h-[300px] md:h-auto">
                  <ChatArea channel={workspaceId} title={`${workspaceName} Chat`} />
                </div>
              )}
            </div>
          )}

          {!workspaceFeatures.announcements && !workspaceFeatures.files && !workspaceFeatures.chat && (
            <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-6 text-center text-sm text-zinc-500">
              No overview modules are enabled for this workspace.
            </div>
          )}

          {workspaceFeatures.kanban ? (
            <div className="h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">General Tasks</h2>
              </div>
              {tasks === undefined ? (
                <div className="h-full flex items-center justify-center border border-white/5 rounded-xl bg-zinc-900/20">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              ) : (
                <Board tasks={tasks} userRole={user?.role} onMoveTask={handleMoveTask} />
              )}
            </div>
          ) : (
            renderModuleDisabled("Kanban", "h-[500px]")
          )}
        </div>
      )}

      {/* Web & Tech Layout (Formerly Overview) */}
      {isWeb && (
        <>
          {(workspaceFeatures.crm ||
            workspaceFeatures.files ||
            workspaceFeatures.support ||
            workspaceFeatures.analytics ||
            workspaceFeatures.chat) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workspaceFeatures.crm && <PipelineWidget leads={leads} />}
              {workspaceFeatures.files && <AssetWidget />}
              {(workspaceFeatures.support || workspaceFeatures.analytics) && (
                <SentimentWidget
                  tickets={tickets}
                  onOpenModal={(mode, data) => setTicketModal({ open: true, mode, data })}
                />
              )}
              {workspaceFeatures.chat && (
                <div className="h-[300px] md:h-auto">
                  <ChatArea channel={workspaceId} title={`${workspaceName} Chat`} />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-6 text-center text-sm text-zinc-500">
              No overview modules are enabled for this workspace.
            </div>
          )}

          {workspaceFeatures.kanban ? (
            <div className="h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-white">Deployment Pipeline</h2>
                  <Button
                    size="sm"
                    className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                    onClick={() => setTaskModal({ open: true, mode: "create" })}
                  >
                    <Plus className="w-3 h-3 mr-1.5" />
                    Add Task
                  </Button>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800">
                      {sprintName}
                    </Badge>
                    <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800">
                      {dateRange}
                    </Badge>
                  </div>
                </div>
              </div>
              {tasks === undefined ? (
                <div className="h-full flex items-center justify-center border border-white/5 rounded-xl bg-zinc-900/20">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              ) : (
                <Board tasks={tasks} userRole={user?.role} onMoveTask={handleMoveTask} />
              )}
            </div>
          ) : (
            renderModuleDisabled("Kanban", "h-[500px]")
          )}

          {workspaceFeatures.crm ? (
            <CrmTable
              leads={leads}
              onOpenModal={(mode, data) => setLeadModal({ open: true, mode, data })}
            />
          ) : (
            renderModuleDisabled("CRM")
          )}
        </>
      )}

      {/* Growth Layout */}
      {isGrowth && (
        workspaceFeatures.crm ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PipelineWidget leads={leads} />
              <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-6 flex flex-col justify-center">
                  <h3 className="text-zinc-400 font-medium mb-2">Average Deal Size</h3>
                  <div className="text-3xl font-bold text-white">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumSignificantDigits: 3,
                    }).format(avgDealSize)}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Based on {leads?.length || 0} active opportunities
                  </p>
                </div>
                {workspaceFeatures.chat && (
                  <div className="h-[300px]">
                    <ChatArea channel={workspaceId} title={`${workspaceName} Chat`} />
                  </div>
                )}
              </div>
            </div>
            <CrmTable
              leads={leads}
              onOpenModal={(mode, data) => setLeadModal({ open: true, mode, data })}
            />
          </div>
        ) : (
          renderModuleDisabled("CRM")
        )
      )}

      {/* Creative Layout */}
      {isCreative && (
        <div className="space-y-6">
          {(workspaceFeatures.files || workspaceFeatures.kanban || workspaceFeatures.chat) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workspaceFeatures.files && <AssetWidget />}
              {workspaceFeatures.kanban && (
                <div className="md:col-span-2 bg-zinc-900/40 border border-white/5 rounded-xl p-6">
                  <h3 className="text-zinc-400 font-medium mb-4">Active Tasks</h3>
                  {activeTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
                      No active tasks in progress.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTasks.slice(0, 4).map((task) => (
                        <div key={task._id} className="bg-zinc-950/50 border border-white/5 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                              Task
                            </Badge>
                            <span className="text-xs text-zinc-500">In Progress</span>
                          </div>
                          <h4 className="text-white font-medium truncate">{task.title}</h4>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[10px] text-zinc-400">
                              {task.assignee_id ? "U" : "?"}
                            </div>
                            <span className="text-xs text-zinc-500">Velocity: {task.velocity_forecast} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {workspaceFeatures.chat && (
                <div className="h-[300px] md:h-auto md:col-span-3">
                   <ChatArea channel={workspaceId} title={`${workspaceName} Chat`} />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-6 text-center text-sm text-zinc-500">
              No creative modules are enabled for this workspace.
            </div>
          )}

          {workspaceFeatures.kanban ? (
            <div className="h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Creative Requests</h2>
              </div>
              {tasks === undefined ? (
                <div className="h-full flex items-center justify-center border border-white/5 rounded-xl bg-zinc-900/20">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              ) : (
                <Board tasks={tasks} userRole={user?.role} onMoveTask={handleMoveTask} />
              )}
            </div>
          ) : (
            renderModuleDisabled("Kanban", "h-[500px]")
          )}
        </div>
      )}

      {/* Clients Layout */}
      {isClients && (
        (workspaceFeatures.support || workspaceFeatures.analytics) ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SentimentWidget
                tickets={tickets}
                onOpenModal={(mode, data) => setTicketModal({ open: true, mode, data })}
              />
              <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-6">
                <h3 className="text-zinc-400 font-medium mb-4">Client Health (Top 5)</h3>
                <div className="space-y-4">
                  {clientHealth.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8">No client data available.</div>
                  ) : (
                    clientHealth.map((client) => (
                      <div key={client.name} className="flex items-center justify-between">
                        <span className="text-zinc-200 font-medium">{client.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <div
                                key={star}
                                className={`w-2 h-2 rounded-full ${
                                  star <= Math.round(client.score / 20) ? "bg-emerald-500" : "bg-zinc-800"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-500 w-8 text-right">{client.score}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          renderModuleDisabled("Support")
        )
      )}

      {/* Modals */}
      <TaskModal 
        isOpen={taskModal.open} 
        onClose={() => setTaskModal({ ...taskModal, open: false })} 
        mode={taskModal.mode}
        initialData={taskModal.data}
      />
      <LeadModal 
        isOpen={leadModal.open} 
        onClose={() => setLeadModal({ ...leadModal, open: false })} 
        mode={leadModal.mode}
        initialData={leadModal.data}
      />
      <TicketModal 
        isOpen={ticketModal.open && ticketModal.mode !== "resolve"} 
        onClose={() => setTicketModal({ ...ticketModal, open: false })} 
        mode={ticketModal.mode as "create" | "edit"}
        initialData={ticketModal.data}
      />
      <ResolveTicketModal
        isOpen={ticketModal.open && ticketModal.mode === "resolve"}
        onClose={() => setTicketModal({ ...ticketModal, open: false })}
        initialData={ticketModal.data}
      />
      
      {workspaceId && (
        <WorkspaceMembersDialog 
          isOpen={membersModalOpen}
          onClose={() => setMembersModalOpen(false)}
          workspaceId={workspaceId as Id<"workspaces">}
          workspaceName={workspaceName}
        />
      )}
    </div>
  );
}