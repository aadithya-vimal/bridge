import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Megaphone, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AnnouncementsWidgetProps {
  userRole?: string;
}

export function AnnouncementsWidget({ userRole }: AnnouncementsWidgetProps) {
  const announcements = useQuery(api.announcements.get);
  const createAnnouncement = useMutation(api.announcements.create);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createAnnouncement({
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        priority: formData.get("priority") as string,
      });
      toast.success("Announcement posted");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to post announcement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md:col-span-2 bg-zinc-900/40 border border-white/5 rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-400 font-medium flex items-center gap-2">
          <Megaphone className="w-4 h-4" />
          Team Announcements
        </h3>
        {userRole === "admin" && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                <Plus className="w-3 h-3 mr-1.5" />
                Post
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Post Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input name="title" required className="bg-zinc-900 border-zinc-800" placeholder="e.g., Q4 Objectives" />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea name="content" required className="bg-zinc-900 border-zinc-800 min-h-[100px]" placeholder="Announcement details..." />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Announcement"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 max-h-[400px]">
        {announcements === undefined ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-zinc-500 py-8 text-sm">
            No announcements yet.
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a._id} className="p-4 rounded-lg bg-zinc-950/50 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {a.priority === "high" && <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Urgent</Badge>}
                  {a.priority === "medium" && <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Update</Badge>}
                  {a.priority === "low" && <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Info</Badge>}
                  <span className="text-xs text-zinc-500">
                    {new Date(a._creationTime).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-xs text-zinc-600">by {a.authorName}</span>
              </div>
              <h4 className="text-zinc-200 font-medium mb-1">{a.title}</h4>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{a.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
