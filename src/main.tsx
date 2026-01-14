import { Toaster } from "@/components/ui/sonner";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "./index.css";
import "./types/global.d.ts";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const DashboardLayout = lazy(() => import("./pages/dashboard/Layout.tsx"));
const DashboardPage = lazy(() => import("./pages/dashboard/Page.tsx"));
const AdminPage = lazy(() => import("./pages/dashboard/Admin.tsx"));
const AssetsPage = lazy(() => import("./pages/dashboard/Assets.tsx"));
const CompanySetup = lazy(() => import("./pages/dashboard/CompanySetup.tsx"));
const CompaniesPage = lazy(() => import("./pages/dashboard/Companies.tsx"));
const GlobalChatPage = lazy(() => import("./pages/dashboard/GlobalChat.tsx"));
const TicketsPage = lazy(() => import("./pages/dashboard/Tickets.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-zinc-500">Loading BRIDGE OS...</div>
    </div>
  );
}

// HARDCODED: This bypasses Cloudflare variable issues and fixes the "Couldn't parse" error.
const convex = new ConvexReactClient("https://bridge-cc438.convex.cloud");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="setup" element={<CompanySetup />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="chat" element={<GlobalChatPage />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="workspace/:workspaceId" element={<DashboardPage />} />
                
                <Route path="assets" element={<AssetsPage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster />
    </ConvexAuthProvider>
  </StrictMode>,
);