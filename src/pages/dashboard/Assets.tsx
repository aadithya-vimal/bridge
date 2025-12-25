import { AssetWidget } from "@/components/dashboard/AssetWidget";

export default function AssetsPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">System Assets</h1>
      </div>
      <div className="h-[calc(100vh-200px)]">
        <AssetWidget />
      </div>
    </div>
  );
}
