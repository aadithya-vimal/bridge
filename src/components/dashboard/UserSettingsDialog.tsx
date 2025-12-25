import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Settings, Upload, Loader2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Id } from "@/convex/_generated/dataModel";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
}

export function UserSettingsDialog({ open, onOpenChange, currentUser }: UserSettingsDialogProps) {
  const updateSelf = useMutation(api.users.updateSelf);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const verifyEmailChange = useMutation(api.users.verifyEmailChange);
  const resendVerificationCode = useMutation(api.users.resendVerificationCode);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setImagePreview(currentUser.image || null);
      
      // Reset verification state on open
      if (!open) {
        setIsVerifying(false);
        setVerificationCode("");
      }
    }
  }, [currentUser, open]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageStorageId: Id<"_storage"> | undefined = undefined;

      // Upload image if selected
      if (selectedImage) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        
        if (!result.ok) throw new Error("Upload failed");
        const { storageId } = await result.json();
        imageStorageId = storageId;
      }

      const result = await updateSelf({ 
        name, 
        email,
        imageStorageId 
      });

      if (result.status === "verification_required") {
        setIsVerifying(true);
        setPendingEmail(email);
        toast.info("Verification code sent to your new email.");
        // In dev mode, we can hint where to find it
        console.log("Check server logs for verification code");
      } else {
        toast.success("Profile updated successfully");
        onOpenChange(false);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update profile";
      toast.error(errorMessage);
      console.error(error);
      
      // Reset email to current if failed
      if (currentUser) setEmail(currentUser.email || "");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyEmailChange({ code: verificationCode });
      toast.success("Email verified and updated successfully");
      onOpenChange(false);
      setIsVerifying(false);
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    try {
      await resendVerificationCode();
      toast.success("Verification code resent");
      setResendCooldown(60);
      console.log("Check server logs for new code");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    }
  };

  if (isVerifying) {
    return (
      <Dialog open={open} onOpenChange={(val) => {
        if (!val) setIsVerifying(false);
        onOpenChange(val);
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Email Change</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Please enter the 6-digit code sent to <strong>{pendingEmail}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerify} className="space-y-6 py-4">
            <div className="flex justify-center">
              <InputOTP
                value={verificationCode}
                onChange={setVerificationCode}
                maxLength={6}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} className="border-zinc-700" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="flex justify-center">
              <Button
                type="button"
                variant="link"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className="text-zinc-400 hover:text-white text-sm"
              >
                {resendCooldown > 0 
                  ? `Resend code in ${resendCooldown}s` 
                  : "Resend verification code"}
              </Button>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsVerifying(false)} 
                className="text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || verificationCode.length !== 6} 
                className="bg-white text-black hover:bg-zinc-200"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify & Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            User Settings
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Update your personal profile information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="w-24 h-24 border-2 border-zinc-800 group-hover:border-zinc-600 transition-colors">
                <AvatarImage src={imagePreview || ""} />
                <AvatarFallback className="bg-zinc-800 text-2xl">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageSelect}
            />
            <p className="text-xs text-zinc-500">Click to upload new picture</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                placeholder="name@example.com"
              />
              <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Changing email requires verification.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-zinc-200">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}