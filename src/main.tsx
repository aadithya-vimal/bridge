import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "./index.css";
import "./types/global.d.ts";

// Lazy load route components for better code splitting
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

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-zinc-500">Loading BRIDGE OS...</div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <ErrorBoundary>
          <BrowserRouter>
            <RouteSyncer />
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
                
                {/* Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="setup" element={<CompanySetup />} />
                  <Route path="companies" element={<CompaniesPage />} />
                  <Route path="chat" element={<GlobalChatPage />} />
                  <Route path="tickets" element={<TicketsPage />} />
                  {/* Dynamic Workspace Route */}
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
    </InstrumentationProvider>
  </StrictMode>,
);