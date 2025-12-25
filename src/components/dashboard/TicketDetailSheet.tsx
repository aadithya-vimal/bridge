import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, GitCommit, ArrowRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TicketDetailSheetProps {
  ticketId: Id<"tickets"> | null;
  onClose: () => void;
}

export function TicketDetailSheet({ ticketId, onClose }: TicketDetailSheetProps) {
  const [comment, setComment] = useState("");
  const [isCommit, setIsCommit] = useState(false);
  const [forwardWorkspaceId, setForwardWorkspaceId] = useState<string>("");
  const [closeReason, setCloseReason] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const ticket = useQuery(api.tickets.get, {})?.find(t => t._id === ticketId);
  const timeline = useQuery(api.tickets.getTimeline, ticketId ? { ticketId } : "skip");
  const workspaces = useQuery(api.workspaces.list);
  const user = useQuery(api.users.currentUser);

  const addEntry = useMutation(api.tickets.addTimelineEntry);
  const forwardTicket = useMutation(api.tickets.forward);
  const initiateClose = useMutation(api.tickets.initiateClose);
  const finalizeClose = useMutation(api.tickets.finalizeClose);

  const handleSubmitComment = async () => {
    if (!ticketId || !comment.trim()) return;
    try {
      await addEntry({
        ticketId,
        type: isCommit ? "commit" : "comment",
        content: comment,
      });
      setComment("");
      setIsCommit(false);
      toast.success(isCommit ? "Commit added" : "Comment added");
    } catch (error) {
      toast.error("Failed to add entry");
    }
  };

  const handleForward = async () => {
    if (!ticketId || !forwardWorkspaceId) return;
    try {
      await forwardTicket({
        ticketId,
        workspaceId: forwardWorkspaceId as Id<"workspaces">,
      });
      setForwardWorkspaceId("");
      toast.success("Ticket forwarded");
    } catch (error) {
      toast.error("Failed to forward ticket");
    }
  };

  const handleInitiateClose = async () => {
    if (!ticketId) return;
    if (!closeReason.trim()) {
      toast.error("Please provide a reason for closing");
      return;
    }
    try {
      await initiateClose({
        ticketId,
        reason: closeReason,
      });
      setShowCloseDialog(false);
      setCloseReason("");
      toast.success("Close initiated");
    } catch (error) {
      toast.error("Failed to initiate close");
    }
  };

  const handleFinalizeClose = async () => {
    if (!ticketId) return;
    try {
      await finalizeClose({ ticketId });
      toast.success("Ticket closed");
    } catch (error) {
      toast.error("Failed to close ticket. You may not have permission.");
    }
  };

  // Direct close handler for the new button
  const handleDirectClose = async () => {
    if (!ticketId) return;
    try {
      // If we have a reason, we could use initiateClose, but user wants "Close" to work.
      // We'll try to finalize directly.
      await finalizeClose({ ticketId });
      toast.success("Ticket closed");
    } catch (error) {
      // If finalize fails (e.g. strict permissions), try initiate close flow or show error
      toast.error("Failed to close ticket directly. Try marking as resolved first.");
    }
  };

  if (!ticketId) return null;

  return (
    <Sheet open={!!ticketId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-200 flex flex-col p-0 h-full max-h-screen overflow-hidden">
        {ticket ? (
          <>
            <div className="p-6 border-b border-zinc-800 shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge 
                    variant="outline" 
                    className={`mb-2 ${
                      ticket.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      ticket.status === 'pending_closure' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}
                  >
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <SheetTitle className="text-2xl font-bold text-white">{ticket.subject}</SheetTitle>
                  <SheetDescription className="text-zinc-400 mt-1">
                    Created by {ticket.creatorName} • {formatDistanceToNow(ticket._creationTime)} ago
                  </SheetDescription>
                </div>
                {ticket.priority && (
                  <Badge variant="outline" className="border-zinc-700">
                    {ticket.priority} Priority
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block mb-1">Assigned Workspace</span>
                  <span className="font-medium text-white">{ticket.workspaceName}</span>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 block mb-1">Client ID</span>
                  <span className="font-medium text-white">{ticket.client_id || "Internal"}</span>
                </div>
              </div>

              {ticket.description && (
                <div className="mt-4 text-sm text-zinc-300 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
                  {ticket.description}
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 min-h-0 p-6">
              <div className="space-y-6">
                {timeline?.map((entry) => (
                  <div key={entry._id} className="flex gap-4">
                    <Avatar className="w-8 h-8 border border-zinc-800 mt-1">
                      <AvatarImage src={entry.userImage} />
                      <AvatarFallback className="bg-zinc-800 text-xs">
                        {entry.userName?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-zinc-200">{entry.userName}</span>
                        <span className="text-xs text-zinc-500">{formatDistanceToNow(entry._creationTime)} ago</span>
                        {entry.type === 'commit' && (
                          <Badge variant="outline" className="h-5 text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                            <GitCommit className="w-3 h-3 mr-1" /> COMMIT
                          </Badge>
                        )}
                        {entry.type === 'status_change' && (
                          <Badge variant="outline" className="h-5 text-[10px] bg-zinc-800 text-zinc-400 border-zinc-700">
                            SYSTEM
                          </Badge>
                        )}
                      </div>
                      <div className={`text-sm p-3 rounded-lg ${
                        entry.type === 'commit' ? 'bg-indigo-950/20 border border-indigo-500/20 text-indigo-200' :
                        entry.type === 'status_change' ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 italic' :
                        'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      }`}>
                        {entry.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 space-y-4 shrink-0">
              {/* Actions Area */}
              <div className="flex flex-wrap gap-2 mb-4">
                {ticket.status !== 'closed' && (
                  <>
                    <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      <Select value={forwardWorkspaceId} onValueChange={setForwardWorkspaceId}>
                        <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent focus:ring-0">
                          <SelectValue placeholder="Forward to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaces?.map(ws => (
                            <SelectItem key={ws._id} value={ws._id}>{ws.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={handleForward}
                        disabled={!forwardWorkspaceId}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {ticket.status === 'open' && (
                      <div className="flex items-center gap-2">
                        {showCloseDialog ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <Textarea 
                              placeholder="Reason for closing..." 
                              className="h-8 min-h-0 w-[200px] py-1 text-xs resize-none"
                              value={closeReason}
                              onChange={(e) => setCloseReason(e.target.value)}
                            />
                            <Button size="sm" variant="destructive" className="h-8" onClick={handleInitiateClose}>
                              Confirm
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowCloseDialog(false)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                              onClick={handleDirectClose}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Close Ticket
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-9 border-zinc-700 hover:bg-zinc-800"
                              onClick={() => setShowCloseDialog(true)}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Resolve (Pending)
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {ticket.status === 'pending_closure' && (
                      <Button 
                        size="sm" 
                        className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleFinalizeClose}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Finalize Closure
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Comment Input */}
              {ticket.status !== 'closed' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder={isCommit ? "Write an immutable commit..." : "Write a comment..."}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className={`min-h-[80px] bg-zinc-950 border-zinc-800 focus:ring-1 ${
                        isCommit ? 'focus:ring-indigo-500 border-indigo-500/30' : 'focus:ring-zinc-700'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isCommit ? "default" : "ghost"}
                          className={`h-7 text-xs ${isCommit ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                          onClick={() => setIsCommit(!isCommit)}
                        >
                          <GitCommit className="w-3 h-3 mr-1" />
                          Commit
                        </Button>
                        <span className="text-[10px] text-zinc-600">
                          {isCommit ? "Commits cannot be edited or deleted" : "Standard comment"}
                        </span>
                      </div>
                      <Button size="sm" onClick={handleSubmitComment} disabled={!comment.trim()}>
                        <Send className="w-3 h-3 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}