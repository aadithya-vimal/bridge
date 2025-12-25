import { ChatArea } from "@/components/dashboard/ChatArea";

export default function GlobalChatPage() {
  return (
    <div className="h-[calc(100vh-100px)] max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Global HQ Chat</h1>
        <p className="text-zinc-400">Communicate with everyone in the company.</p>
      </div>
      <div className="h-[calc(100%-80px)]">
        <ChatArea className="h-full" title="Company Headquarters" />
      </div>
    </div>
  );
}
