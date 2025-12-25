import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface ChatAreaProps {
  channel?: string;
  title?: string;
  className?: string;
}

export function ChatArea({ channel, title = "Team Chat", className }: ChatAreaProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messages = useQuery(api.chat.list, { channel }) || [];
  const sendMessage = useMutation(api.chat.send);
  const deleteMessage = useMutation(api.chat.deleteMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only fetch workspace role if channel is a valid ID (simple check length > 20 usually implies ID)
  // or just try to fetch and let it return null if not found
  const workspaceRole = useQuery(api.workspaces.getMyWorkspaceRole, 
    channel ? { workspaceId: channel as Id<"workspaces"> } : "skip"
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    try {
      await sendMessage({ body: message, channel });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDelete = async (messageId: Id<"messages">) => {
    try {
      await deleteMessage({ messageId });
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const canDelete = (msg: any) => {
    if (!user) return false;
    if (msg.userId === user._id) return true;
    if (user.role === "admin") return true;
    if (workspaceRole === "admin") return true;
    return false;
  };

  return (
    <Card className={`flex flex-col h-full bg-zinc-900/40 border-white/5 ${className}`}>
      <CardHeader className="p-4 border-b border-white/5">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
                <div className="text-center text-zinc-500 text-sm py-8">No messages yet. Start the conversation!</div>
            ) : (
                messages.map((msg) => (
                <div key={msg._id} className="flex gap-3 group">
                    <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={msg.userImage} />
                    <AvatarFallback className="bg-zinc-800 text-xs">
                        {msg.userName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-200 truncate">{msg.userName}</span>
                        {msg.userRole === "admin" && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-rose-500/50 text-rose-400 bg-rose-500/10">
                            ADMIN
                        </Badge>
                        )}
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {new Date(msg._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {canDelete(msg) && (
                          <button 
                            onClick={() => handleDelete(msg._id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-rose-500"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 text-sm text-zinc-300 break-words">
                        {msg.body}
                    </div>
                    </div>
                </div>
                ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-white/5 bg-zinc-900/50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${channel ? "workspace" : "everyone"}...`} 
              className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-indigo-500"
            />
            <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}