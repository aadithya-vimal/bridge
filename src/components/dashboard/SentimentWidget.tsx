import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Filter, Frown, Inbox, Loader2, Plus, Search, Smile, X, Undo2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

interface SentimentWidgetProps {
  tickets: any[] | undefined;
  onOpenModal: (mode: "create" | "edit" | "resolve", data?: any) => void;
}

export function SentimentWidget({ tickets, onOpenModal }: SentimentWidgetProps) {
  const [showClosedTickets, setShowClosedTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const reopenTicket = useMutation(api.tickets.reopen);

  const handleReopenTicket = async (ticketId: string) => {
    try {
      await reopenTicket({ 
        ticketId: ticketId as Id<"tickets">
      });
      toast.success("Ticket reopened");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to reopen ticket", {
        description: errorMessage
      });
    }
  };

  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
      <CardHeader className="pb-2 flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between w-full">
          <CardTitle className="text-sm font-medium text-zinc-400">Client Sentiment</CardTitle>
          <div className="flex items-center gap-1">
             <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-zinc-500 hover:text-white"
              onClick={() => onOpenModal("create")}
              title="Log Ticket"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Select value={ticketFilter} onValueChange={setTicketFilter}>
              <SelectTrigger className="h-6 w-[90px] text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-6 w-6 ${showClosedTickets ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
              onClick={() => setShowClosedTickets(!showClosedTickets)}
              title={showClosedTickets ? "Hide Closed Tickets" : "Show Closed Tickets"}
            >
              <Filter className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
          <Input 
            placeholder="Search tickets..." 
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            className="h-7 pl-7 text-xs bg-zinc-950/50 border-zinc-800 focus-visible:ring-zinc-700"
          />
          {ticketSearch && (
            <button 
              onClick={() => setTicketSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          {tickets === undefined ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No tickets found</p>
              <p className="text-xs text-zinc-500 mt-1">Client sentiment is quiet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets
                .filter(ticket => {
                  const sentiment = ticket.sentiment_score ?? 50;
                  if (!showClosedTickets && ticket.status === 'Closed') return false;
                  if (ticketFilter === 'positive' && sentiment <= 50) return false;
                  if (ticketFilter === 'negative' && sentiment > 50) return false;
                  
                  if (ticketSearch) {
                    const searchLower = ticketSearch.toLowerCase();
                    return (
                      ticket.subject.toLowerCase().includes(searchLower) ||
                      (ticket.client_id || "").toLowerCase().includes(searchLower) ||
                      ticket.status.toLowerCase().includes(searchLower)
                    );
                  }
                  
                  return true;
                })
                .map((ticket) => (
                <div key={ticket._id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {(ticket.sentiment_score ?? 50) > 50 ? (
                      <Smile className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Frown className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span 
                            className={`text-sm truncate cursor-pointer hover:underline ${ticket.status === 'Closed' ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}
                            onClick={() => onOpenModal("edit", ticket)}
                          >
                            {ticket.subject}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-zinc-900 border-zinc-800 text-zinc-300 max-w-[250px]">
                          <p className="font-medium">{ticket.subject}</p>
                          {ticket.status === 'Closed' && ticket.closing_statement && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Resolution</p>
                              <p className="text-xs text-zinc-400 italic">"{ticket.closing_statement}"</p>
                            </div>
                          )}
                          <p className="text-[10px] text-zinc-500 mt-2">Click to edit</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-[10px] text-zinc-600 font-medium flex items-center gap-1.5">
                        <span className="uppercase tracking-wider">{ticket.status}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
                        <span className="truncate max-w-[80px]">{ticket.client_id}</span>
                        {ticket.workspaceName && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
                            <span className="flex items-center gap-0.5 text-zinc-500">
                              <Users className="w-2.5 h-2.5" />
                              <span className="capitalize">{ticket.workspaceName}</span>
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`text-xs font-mono ${(ticket.sentiment_score ?? 50) > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ticket.sentiment_score ?? 50}%
                    </div>
                    
                    {ticket.status !== 'Closed' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => onOpenModal("resolve", ticket)}
                        title="Resolve Ticket"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => handleReopenTicket(ticket._id)}
                        title="Reopen Ticket"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {tickets.filter(ticket => {
                  const sentiment = ticket.sentiment_score ?? 50;
                  if (!showClosedTickets && ticket.status === 'Closed') return false;
                  if (ticketFilter === 'positive' && sentiment <= 50) return false;
                  if (ticketFilter === 'negative' && sentiment > 50) return false;
                  if (ticketSearch) {
                    const searchLower = ticketSearch.toLowerCase();
                    return (
                      ticket.subject.toLowerCase().includes(searchLower) ||
                      (ticket.client_id || "").toLowerCase().includes(searchLower) ||
                      ticket.status.toLowerCase().includes(searchLower)
                    );
                  }
                  return true;
              }).length === 0 && tickets.length > 0 && (
                 <div className="py-8 text-center text-zinc-500 text-sm italic flex flex-col items-center justify-center">
                   <div className="w-10 h-10 rounded-full bg-zinc-800/30 flex items-center justify-center mb-2">
                     <Search className="w-5 h-5 text-zinc-600" />
                   </div>
                   No tickets match your filters.
                 </div>
              )}
            </div>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}