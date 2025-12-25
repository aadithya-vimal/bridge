import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Search, Filter, Ticket as TicketIcon, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { TicketDetailSheet } from "@/components/dashboard/TicketDetailSheet";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"tickets"> | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const tickets = useQuery(api.tickets.get, {});
  const workspaces = useQuery(api.workspaces.list);
  const createTicket = useMutation(api.tickets.create);

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createTicket({
        subject: formData.get("subject") as string,
        description: formData.get("description") as string,
        priority: formData.get("priority") as string,
        assigned_workspace_id: formData.get("workspace") ? formData.get("workspace") as Id<"workspaces"> : undefined,
      });
      setIsCreateOpen(false);
      toast.success("Ticket created successfully");
    } catch (error) {
      toast.error("Failed to create ticket");
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-indigo-400" />
            Tickets & Issues
          </h1>
          <p className="text-zinc-400">Manage and track cross-team workflows and issues</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input name="subject" required placeholder="Brief summary of the issue" className="bg-zinc-950 border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="Detailed explanation..." className="bg-zinc-950 border-zinc-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Workspace</Label>
                  <Select name="workspace">
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces?.map(ws => (
                        <SelectItem key={ws._id} value={ws._id}>{ws.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Create Ticket</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search tickets..." 
            className="pl-9 bg-zinc-950 border-zinc-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending_closure">Pending Closure</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTickets?.map((ticket) => (
          <Card 
            key={ticket._id} 
            className="bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60 transition-colors cursor-pointer group"
            onClick={() => setSelectedTicketId(ticket._id)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' :
                ticket.status === 'pending_closure' ? 'bg-amber-500/10 text-amber-400' :
                'bg-zinc-500/10 text-zinc-400'
              }`}>
                {ticket.status === 'open' ? <AlertCircle className="w-5 h-5" /> :
                 ticket.status === 'pending_closure' ? <Clock className="w-5 h-5" /> :
                 <CheckCircle2 className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-zinc-200 truncate">{ticket.subject}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    ticket.priority === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {ticket.priority?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{ticket.workspaceName}</span>
                  <span>•</span>
                  <span>Created by {ticket.creatorName}</span>
                  <span>•</span>
                  <span>{new Date(ticket._creationTime).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-zinc-400 mb-1">
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredTickets?.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No tickets found matching your criteria.
          </div>
        )}
      </div>

      <TicketDetailSheet 
        ticketId={selectedTicketId} 
        onClose={() => setSelectedTicketId(null)} 
      />
    </div>
  );
}
