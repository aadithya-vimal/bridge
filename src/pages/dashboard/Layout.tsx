import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { BarChart3, Box, Command, Globe, LayoutGrid, LogOut, Search, ShieldCheck, Users, Building, Briefcase, Building2, Code, DollarSign, Megaphone, PieChart, Heart, Settings, Scale, PenTool, LifeBuoy, Database, Lock, Truck, Microscope, Calendar, FileText, Target, Menu, MessageSquare, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ChatSheet } from "@/components/dashboard/ChatSheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RequestRoleDialog } from "@/components/dashboard/RequestRoleDialog";
import { UserSettingsDialog } from "@/components/dashboard/UserSettingsDialog";

export default function DashboardLayout() {
  const { signOut, user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requestRoleOpen, setRequestRoleOpen] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const promoteAdmin = useMutation(api.users.promoteAdmin);
  const leaveCompany = useMutation(api.companies.leave);
  
  // Fetch workspaces and company
  const workspaces = useQuery(api.workspaces.list);
  const company = useQuery(api.companies.getMyCompany);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user && !user.companyId && location.pathname !== "/dashboard/setup") {
      navigate("/dashboard/setup");
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (user) {
      promoteAdmin();
    }
  }, [user, promoteAdmin]);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleLeaveCompany = () => {
    setLeaveConfirmOpen(true);
  };

  const confirmLeaveCompany = async () => {
    try {
      await leaveCompany();
      toast.success("Left company successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to leave company. Owners cannot leave.");
    }
  };

  // Map workspace types to icons
  const getIcon = (type: string) => {
    switch (type) {
      case "web": return Globe;
      case "growth": return BarChart3;
      case "creative": return LayoutGrid;
      case "clients": return Users;
      case "engineering": return Code;
      case "sales": return DollarSign;
      case "marketing": return Megaphone;
      case "finance": return PieChart;
      case "hr": return Heart;
      case "operations": return Settings;
      case "legal": return Scale;
      case "product": return Box;
      case "design": return PenTool;
      case "support": return LifeBuoy;
      case "data": return Database;
      case "security": return Lock;
      case "executive": return Briefcase;
      case "logistics": return Truck;
      case "research": return Microscope;
      case "events": return Calendar;
      case "content": return FileText;
      case "strategy": return Target;
      default: return Briefcase;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "web": return "text-indigo-400";
      case "growth": return "text-amber-400";
      case "creative": return "text-fuchsia-400";
      case "clients": return "text-emerald-400";
      case "engineering": return "text-blue-400";
      case "sales": return "text-green-400";
      case "marketing": return "text-pink-400";
      case "finance": return "text-yellow-400";
      case "hr": return "text-red-400";
      case "operations": return "text-slate-400";
      case "legal": return "text-orange-400";
      case "product": return "text-purple-400";
      case "design": return "text-violet-400";
      case "support": return "text-cyan-400";
      case "data": return "text-teal-400";
      case "security": return "text-rose-400";
      case "executive": return "text-sky-400";
      case "logistics": return "text-lime-400";
      case "research": return "text-indigo-300";
      case "events": return "text-amber-300";
      case "content": return "text-fuchsia-300";
      case "strategy": return "text-emerald-300";
      default: return "text-zinc-400";
    }
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full w-full flex-col bg-zinc-900/60 backdrop-blur-xl">
      <div className="h-14 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Bridge Logo" className="w-6 h-6" />
          <span className="font-bold tracking-tight text-white">BRIDGE</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">
          {company ? (company.name || "Untitled Company") : "Workspace"}
        </div>
        {user?.companyId ? (
          <>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5",
                location.pathname === "/dashboard" && "bg-white/5 text-white"
              )}
              onClick={() => {
                navigate("/dashboard");
                onNavigate?.();
              }}
            >
              <LayoutGrid className="w-4 h-4 text-white" />
              Dashboard
            </Button>

            {workspaces?.map((ws) => {
              const Icon = getIcon(ws.type);
              const color = getColor(ws.type);
              const path = `/dashboard/workspace/${ws._id}`;
              return (
                <Button
                  key={ws._id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5",
                    location.pathname === path && "bg-white/5 text-white"
                  )}
                  onClick={() => {
                    navigate(path);
                    onNavigate?.();
                  }}
                >
                  <Icon className={cn("w-4 h-4", color)} />
                  {ws.name}
                </Button>
              );
            })}

            <div className="px-3 mt-8 mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">System</div>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5",
                location.pathname === "/dashboard/chat" && "bg-white/5 text-white"
              )}
              onClick={() => {
                navigate("/dashboard/chat");
                onNavigate?.();
              }}
            >
              <MessageSquare className="w-4 h-4" />
              Global Chat
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5",
                location.pathname === "/dashboard/tickets" && "bg-white/5 text-white"
              )}
              onClick={() => {
                navigate("/dashboard/tickets");
                onNavigate?.();
              }}
            >
              <Ticket className="w-4 h-4" />
              Tickets
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5",
                location.pathname === "/dashboard/companies" && "bg-white/5 text-white"
              )}
              onClick={() => {
                navigate("/dashboard/companies");
                onNavigate?.();
              }}
            >
              <Building2 className="w-4 h-4" />
              Companies
            </Button>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5",
                location.pathname === "/dashboard/assets" && "bg-white/5 text-white"
              )}
              onClick={() => {
                navigate("/dashboard/assets");
                onNavigate?.();
              }}
            >
              <Box className="w-4 h-4" />
              Assets
            </Button>
            
            {user?.role === "admin" && (
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5",
                  location.pathname === "/dashboard/admin" && "bg-white/5 text-white"
                )}
                onClick={() => {
                  navigate("/dashboard/admin");
                  onNavigate?.();
                }}
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Admin Controls
              </Button>
            )}
          </>
        ) : (
          <div className="px-3 py-4 text-sm text-zinc-500 italic text-center border border-dashed border-white/10 rounded-lg mx-2">
            Join a company to access workspaces
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={user?.image} />
                <AvatarFallback className="bg-zinc-800 text-xs">US</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email || "user@bridge.os"}</p>
              </div>
              <LogOut className="w-4 h-4 text-zinc-400 opacity-50 group-hover:opacity-100" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => {
                setUserSettingsOpen(true);
                onNavigate?.();
              }}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            {user?.companyId && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setRequestRoleOpen(true);
                    onNavigate?.();
                  }}
                  className="cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Request Role Change
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleLeaveCompany();
                    onNavigate?.();
                  }}
                  className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Leave Company
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => {
                handleSignOut();
                onNavigate?.();
              }}
              className="cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-200 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[260px] flex-shrink-0 border-r border-white/5 bg-zinc-900/60 backdrop-blur-xl flex-col">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-r border-white/10 bg-zinc-950">
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Leave Company Confirmation */}
      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Company?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to leave this company? You will lose access to all workspaces and data associated with this company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeaveCompany} className="bg-rose-600 hover:bg-rose-700 text-white border-none">Leave Company</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Role Dialog */}
      <RequestRoleDialog isOpen={requestRoleOpen} onClose={() => setRequestRoleOpen(false)} />
      
      {/* User Settings Dialog */}
      <UserSettingsDialog open={userSettingsOpen} onOpenChange={setUserSettingsOpen} currentUser={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-zinc-400" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-zinc-500 hover:text-zinc-300">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-zinc-700" />
                <BreadcrumbItem>
                  <BreadcrumbLink className="text-white">
                    {location.pathname === "/dashboard" ? "Overview" : 
                     location.pathname === "/dashboard/admin" ? "Admin" :
                     location.pathname === "/dashboard/assets" ? "Assets" :
                     location.pathname === "/dashboard/companies" ? "Companies" :
                     location.pathname === "/dashboard/tickets" ? "Tickets" :
                     "Workspace"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Command + K..." 
                className="pl-9 bg-zinc-950/50 border-zinc-800 text-sm h-9 focus-visible:ring-zinc-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-2 top-2.5 flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-500 opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden text-zinc-400">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}