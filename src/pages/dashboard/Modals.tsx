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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
}

// --- Task Modal ---
interface TaskModalProps extends BaseModalProps {
  initialData?: {
    _id?: Id<"tasks">;
    title: string;
    status: string;
    velocity_forecast: number;
    is_locked: boolean;
  };
}

export function TaskModal({ isOpen, onClose, mode, initialData }: TaskModalProps) {
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const [formData, setFormData] = useState({
    title: "",
    status: "todo",
    velocity_forecast: 1,
    is_locked: false,
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        title: initialData.title,
        status: initialData.status,
        velocity_forecast: initialData.velocity_forecast,
        is_locked: initialData.is_locked,
      });
    } else {
      setFormData({ title: "", status: "todo", velocity_forecast: 1, is_locked: false });
    }
  }, [mode, initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "create") {
        await createTask(formData);
        toast.success("Task created successfully");
      } else if (mode === "edit" && initialData?._id) {
        await updateTask({
          taskId: initialData._id,
          title: formData.title,
          velocity_forecast: formData.velocity_forecast,
          is_locked: formData.is_locked,
        });
        toast.success("Task updated successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save task");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Task" : "Edit Task"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new task to the board." : "Update task details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-zinc-950 border-zinc-800"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="velocity">Velocity (pts)</Label>
              <Input
                id="velocity"
                type="number"
                min="1"
                value={formData.velocity_forecast}
                onChange={(e) => setFormData({ ...formData, velocity_forecast: parseInt(e.target.value) })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="todo">Backlog</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Air-Lock</SelectItem>
                    <SelectItem value="done">Deployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {mode === "create" ? "Create" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Lead Modal ---
interface LeadModalProps extends BaseModalProps {
  initialData?: {
    _id?: Id<"leads">;
    client_name: string;
    value: number;
    stage: string;
    win_probability: number;
  };
}

export function LeadModal({ isOpen, onClose, mode, initialData }: LeadModalProps) {
  const createLead = useMutation(api.leads.create);
  const updateLead = useMutation(api.leads.update);
  const [formData, setFormData] = useState({
    client_name: "",
    value: 0,
    stage: "New",
    win_probability: 50,
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        client_name: initialData.client_name,
        value: initialData.value,
        stage: initialData.stage,
        win_probability: initialData.win_probability,
      });
    } else {
      setFormData({ client_name: "", value: 0, stage: "New", win_probability: 50 });
    }
  }, [mode, initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "create") {
        await createLead(formData);
        toast.success("Lead created successfully");
      } else if (mode === "edit" && initialData?._id) {
        await updateLead({
          leadId: initialData._id,
          ...formData,
        });
        toast.success("Lead updated successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save lead");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Opportunity" : "Edit Opportunity"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
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
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Win Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.win_probability}
                onChange={(e) => setFormData({ ...formData, win_probability: parseInt(e.target.value) })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select
              value={formData.stage}
              onValueChange={(val) => setFormData({ ...formData, stage: val })}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Outreach">Outreach</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Closing">Closing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {mode === "create" ? "Add Opportunity" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Ticket Modal ---
interface TicketModalProps extends BaseModalProps {
  initialData?: {
    _id?: Id<"tickets">;
    subject: string;
    client_id: string;
    sentiment_score: number;
    status: string;
    assigned_workspace_id?: Id<"workspaces">;
  };
}

export function TicketModal({ isOpen, onClose, mode, initialData }: TicketModalProps) {
  const createTicket = useMutation(api.tickets.create);
  const updateTicket = useMutation(api.tickets.update);
  const workspaces = useQuery(api.workspaces.list);

  const [formData, setFormData] = useState({
    subject: "",
    client_id: "",
    sentiment_score: 50,
    status: "Open",
    assigned_workspace_id: "" as string,
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        subject: initialData.subject,
        client_id: initialData.client_id,
        sentiment_score: initialData.sentiment_score,
        status: initialData.status,
        assigned_workspace_id: initialData.assigned_workspace_id || "",
      });
    } else {
      setFormData({ subject: "", client_id: "", sentiment_score: 50, status: "Open", assigned_workspace_id: "" });
    }
  }, [mode, initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        subject: formData.subject,
        client_id: formData.client_id,
        sentiment_score: formData.sentiment_score,
        status: formData.status,
        assigned_workspace_id: formData.assigned_workspace_id ? (formData.assigned_workspace_id as Id<"workspaces">) : undefined,
      };

      if (mode === "create") {
        await createTicket(payload);
        toast.success("Ticket logged successfully");
      } else if (mode === "edit" && initialData?._id) {
        await updateTicket({
          ticketId: initialData._id,
          ...payload,
        });
        toast.success("Ticket updated successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save ticket");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Log Ticket" : "Edit Ticket"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="bg-zinc-950 border-zinc-800"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
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
                min="0"
                max="100"
                value={formData.sentiment_score}
                onChange={(e) => setFormData({ ...formData, sentiment_score: parseInt(e.target.value) })}
                className="bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace">Assigned Workspace</Label>
              <Select
                value={formData.assigned_workspace_id}
                onValueChange={(val) => setFormData({ ...formData, assigned_workspace_id: val })}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {workspaces?.map((ws) => (
                    <SelectItem key={ws._id} value={ws._id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {mode === "create" ? "Log Ticket" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Resolve Ticket Modal ---
interface ResolveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    _id?: Id<"tickets">;
    subject: string;
  };
}

export function ResolveTicketModal({ isOpen, onClose, initialData }: ResolveTicketModalProps) {
  const resolveTicket = useMutation(api.tickets.resolve);
  const [statement, setStatement] = useState("");

  useEffect(() => {
    setStatement("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData?._id) return;

    try {
      await resolveTicket({
        ticketId: initialData._id,
        closing_statement: statement,
      });
      toast.success("Ticket resolved successfully");
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to resolve ticket";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Resolve Ticket</DialogTitle>
          <DialogDescription>
            Provide a closing statement to resolve "{initialData?.subject}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="statement">Closing Statement</Label>
            <Textarea
              id="statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="bg-zinc-950 border-zinc-800 min-h-[100px]"
              placeholder="Describe how the issue was resolved..."
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Resolve Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}