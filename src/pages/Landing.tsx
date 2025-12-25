import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  ChevronDown, 
  Rocket,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
  LayoutGrid,
  Globe,
  Lock
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Landing() {
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const loginSectionRef = useRef<HTMLDivElement>(null);

  // Fetch tasks for the ticker
  const deployedTasks = useQuery(api.tasks.getDeployed) || [];

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (email) {
        await signIn("email-otp", { email });
        navigate("/auth", { state: { email } });
      } else {
        await signIn("anonymous");
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: LayoutGrid,
      title: "Project Management",
      description: "Agile Kanban boards with real-time updates, velocity tracking, and sprint management."
    },
    {
      icon: Users,
      title: "Client Relations",
      description: "Comprehensive CRM with sentiment analysis, ticket tracking, and opportunity pipelines."
    },
    {
      icon: BarChart3,
      title: "Growth Analytics",
      description: "Dynamic revenue forecasting, lead probability scoring, and performance metrics."
    },
    {
      icon: ShieldCheck,
      title: "Secure Access",
      description: "Role-based workspace controls with granular permission settings and audit logs."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-zinc-950 relative overflow-x-hidden flex flex-col text-white selection:bg-indigo-500/30">
      
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full opacity-50" />
         <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-emerald-500/5 blur-[100px] rounded-full opacity-30" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-28 pb-16 text-center">
        {/* Status Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">System Operational</span>
        </motion.div>

        {/* Main Title */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            BRIDGE
          </h1>
          <p className="text-zinc-400 text-xl md:text-2xl tracking-tight max-w-2xl mx-auto leading-relaxed">
            The Unified Internal Operating System. <br className="hidden md:block" />
            <span className="text-zinc-500">Orchestrate workflows, assets, and intelligence.</span>
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto"
        >
          <Button 
            onClick={scrollToLogin}
            className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 text-base sm:text-lg px-8 py-5 rounded-full font-semibold transition-all hover:scale-105"
          >
            Enter Workspace
          </Button>
          <Button 
            variant="outline"
            className="w-full sm:w-auto border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-base sm:text-lg px-8 py-5 rounded-full font-medium backdrop-blur-sm"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            Documentation
          </Button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-12 animate-bounce cursor-pointer"
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown className="w-6 h-6 text-zinc-600" />
        </motion.div>
      </div>

      {/* Features Grid */}
      <div id="features" className="relative z-10 py-16 px-4 sm:px-6 bg-zinc-950/50 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Capabilities</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Built for high-performance teams requiring strict security and seamless integration.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-5 sm:p-6 h-full rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-zinc-800/50 flex items-center justify-center mb-4 group-hover:bg-indigo-500/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-200">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats / Trust Section */}
      <div className="relative z-10 py-16 px-4 sm:px-6 border-t border-white/5 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">System Uptime</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">&lt; 50ms</div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">Global Latency</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">SOC2</div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">Compliant Security</div>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div ref={loginSectionRef} className="relative z-10 min-h-screen flex flex-col items-center justify-center py-16 px-4 sm:px-6 border-t border-white/5 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 mx-auto bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 shadow-2xl shadow-indigo-500/10">
            <Lock className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Secure Gateway</h2>
          <p className="text-zinc-500">Authenticate to access your organization's dashboard</p>
        </div>

        {/* Authentication Card */}
        <div className="w-full max-w-md rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-12 transition-all"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-white text-black font-semibold py-6 rounded-lg hover:bg-zinc-200 transition-colors text-base"
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Continue with Email
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="text-xs text-zinc-600 uppercase tracking-wider">Or</span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          <Button 
            variant="outline" 
            className="w-full bg-zinc-800 border-zinc-700 text-white py-6 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors flex items-center justify-center gap-3 flex-wrap text-sm sm:text-base h-auto"
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="whitespace-nowrap">Google Workspace</span>
          </Button>
          
          <p className="text-center text-xs text-zinc-600 mt-6">
            Protected by BRIDGE Secure Access. <br />
            Authorized personnel only.
          </p>
        </div>
      </div>

      {/* Footer Ticker */}
      <div className="hidden md:block fixed bottom-0 w-full bg-zinc-950/80 backdrop-blur-md border-t border-white/5 py-2 overflow-hidden z-50">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> SYSTEM: Operational</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          
          {deployedTasks.length > 0 ? (
            deployedTasks.slice(0, 5).map((task) => (
              <div key={task._id} className="flex items-center gap-8">
                <span className="flex items-center gap-2">
                  <Rocket className="w-3 h-3 text-indigo-500" /> 
                  DEPLOYED: {task.title}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
              </div>
            ))
          ) : (
            <span className="flex items-center gap-2">Waiting for deployments...</span>
          )}
        </div>
      </div>
    </div>
  );
}