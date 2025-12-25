import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ChatSheet() {
  const [message, setMessage] = useState("");
  const messages = useQuery(api.chat.list, {}) || [];
  const sendMessage = useMutation(api.chat.send);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    try {
      await sendMessage({ body: message });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 border-none text-white z-50"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-zinc-950 border-l border-white/10 flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-white/5">
          <SheetTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Team Chat
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg._id} className="flex gap-3">
                <Avatar className="w-8 h-8 border border-white/10">
                  <AvatarImage src={msg.userImage} />
                  <AvatarFallback className="bg-zinc-800 text-xs">
                    {msg.userName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-200">{msg.userName}</span>
                    {msg.userRole === "admin" && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-rose-500/50 text-rose-400 bg-rose-500/10">
                        ADMIN
                      </Badge>
                    )}
                    <span className="text-[10px] text-zinc-500">
                      {new Date(msg._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 text-sm text-zinc-300">
                    {msg.body}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5 bg-zinc-900/50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..." 
              className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-indigo-500"
            />
            <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}