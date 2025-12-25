import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { FileImage, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export function AssetWidget() {
  const assets = useQuery(api.assets.get);
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const createAsset = useMutation(api.assets.create);
  const deleteAsset = useMutation(api.assets.deleteAsset);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();

      // 3. Save metadata
      await createAsset({
        title: file.name,
        storageId: storageId as Id<"_storage">,
        type: file.type,
        size: file.size,
      });

      toast.success("Asset uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload asset");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (assetId: Id<"assets">, storageId: Id<"_storage">) => {
    try {
      await deleteAsset({ assetId, storageId });
      toast.success("Asset deleted");
    } catch (error) {
      toast.error("Failed to delete asset");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm group relative overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent pointer-events-none" />
      <CardHeader className="pb-2 relative flex flex-row items-center justify-between z-10">
        <CardTitle className="text-sm font-medium text-zinc-400">Creative Assets</CardTitle>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
          />
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-white/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex-1 min-h-0 p-0">
        <ScrollArea className="h-[240px] px-6 pb-4">
          {assets === undefined ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No assets yet</p>
              <p className="text-xs text-zinc-500 mt-1">Upload images or PDFs</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {assets.map((asset) => (
                <div key={asset._id} className="flex items-center gap-3 group/item">
                  <div className="w-10 h-10 rounded bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {asset.type.startsWith("image/") && asset.url ? (
                      <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                    ) : (
                      <FileImage className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-200 truncate" title={asset.title}>
                      {asset.title}
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      <span>{formatSize(asset.size)}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
                      <span>{new Date(asset._creationTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                    onClick={() => handleDelete(asset._id, asset.storageId)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}