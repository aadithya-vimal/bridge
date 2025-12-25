import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- Task Dialog ---

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    _id: Id<"tasks">;
    title: string;
    status: string;
    velocity_forecast: number;
    is_locked: boolean;
  };
}

export function TaskDialog({ open, onOpenChange, initialData }: TaskDialogProps) {
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [velocity, setVelocity] = useState("3");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setStatus(initialData?.status || "todo");
      setVelocity(initialData?.velocity_forecast?.toString() || "3");
      setIsLocked(initialData?.is_locked || false);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (initialData) {
        await updateTask({
          taskId: initialData._id,
          title,
          velocity_forecast: parseInt(velocity),
          is_locked: isLocked,
        });
        toast.success("Task updated");
      } else {
        await createTask({
          title,
          status,
          velocity_forecast: parseInt(velocity),
          is_locked: isLocked,
        });
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? "Update task details." : "Add a new task to the board."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              required
            />
          </div>
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="todo">Backlog</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Air-Lock</SelectItem>
                  <SelectItem value="done">Deployed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="velocity">Velocity Points</Label>
              <Input
                id="velocity"
                type="number"
                value={velocity}
                onChange={(e) => setVelocity(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                min="1"
                max="21"
              />
            </div>
            <div className="flex items-center justify-between space-y-2 pt-8">
              <Label htmlFor="locked" className="cursor-pointer">Locked</Label>
              <Switch
                id="locked"
                checked={isLocked}
                onCheckedChange={setIsLocked}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-zinc-200">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Lead Dialog ---

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    _id: Id<"leads">;
    client_name: string;
    value: number;
    stage: string;
    win_probability: number;
  };
}

export function LeadDialog({ open, onOpenChange, initialData }: LeadDialogProps) {
  const createLead = useMutation(api.leads.create);
  const updateLead = useMutation(api.leads.update);
  const [isLoading, setIsLoading] = useState(false);

  const [clientName, setClientName] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("New");
  const [probability, setProbability] = useState("50");

  useEffect(() => {
    if (open) {
      setClientName(initialData?.client_name || "");
      setValue(initialData?.value?.toString() || "");
      setStage(initialData?.stage || "New");
      setProbability(initialData?.win_probability?.toString() || "50");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (initialData) {
        await updateLead({
          leadId: initialData._id,
          client_name: clientName,
          value: parseFloat(value),
          stage,
          win_probability: parseInt(probability),
        });
        toast.success("Lead updated");
      } else {
        await createLead({
          client_name: clientName,
          value: parseFloat(value),
          stage,
          win_probability: parseInt(probability),
        });
        toast.success("Lead created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save lead");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Opportunity" : "New Opportunity"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? "Update deal details." : "Add a new sales opportunity."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value ($)</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                min="0"
                max="100"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Qualification">Qualification</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Closing">Closing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-zinc-200">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Ticket Dialog ---

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    _id: Id<"tickets">;
    subject: string;
    client_id: string;
    sentiment_score: number;
    status: string;
    assigned_workspace_id?: Id<"workspaces">;
  };
}

export function TicketDialog({ open, onOpenChange, initialData }: TicketDialogProps) {
  const createTicket = useMutation(api.tickets.create);
  const updateTicket = useMutation(api.tickets.update);
  const workspaces = useQuery(api.workspaces.list);
  const [isLoading, setIsLoading] = useState(false);

  const [subject, setSubject] = useState("");
  const [clientId, setClientId] = useState("");
  const [sentiment, setSentiment] = useState("50");
  const [status, setStatus] = useState("Open");
  const [workspaceId, setWorkspaceId] = useState("");

  useEffect(() => {
    if (open) {
      setSubject(initialData?.subject || "");
      setClientId(initialData?.client_id || "");
      setSentiment(initialData?.sentiment_score?.toString() || "50");
      setStatus(initialData?.status || "Open");
      setWorkspaceId(initialData?.assigned_workspace_id || "");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        subject,
        client_id: clientId,
        sentiment_score: parseInt(sentiment),
        status,
        assigned_workspace_id: workspaceId ? (workspaceId as Id<"workspaces">) : undefined,
      };

      if (initialData) {
        await updateTicket({
          ticketId: initialData._id,
          ...payload,
        });
        toast.success("Ticket updated");
      } else {
        await createTicket(payload);
        toast.success("Ticket created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save ticket");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Ticket" : "Log Ticket"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {initialData ? "Update ticket details." : "Log a new client ticket."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment (0-100)</Label>
              <Input
                id="sentiment"
                type="number"
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                min="0"
                max="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace">Assigned Workspace</Label>
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {workspaces?.map((ws) => (
                  <SelectItem key={ws._id} value={ws._id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-zinc-200">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Log Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}