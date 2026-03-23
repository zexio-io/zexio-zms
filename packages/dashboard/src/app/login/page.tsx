"use client";

import { useState, useEffect } from "react";
import { signIn } from "@/infrastructure/auth/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUIStore } from "@/infrastructure/state/store";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Lock as LockIcon, Mail, Loader2, ShieldCheck, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { ToneToggle } from "@/ui/components/auth/tone-toggle";

import { getApiBaseUrl } from "@/infrastructure/utils/utils";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const labels = useUIStore(state => state.getLabels());

  useEffect(() => {
    setMounted(true);
    const checkStatus = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/init-status`);
        const data = await response.json();
        setIsInitialized(data.initialized);
      } catch (e) {
        console.error("Failed to check init status", e);
      }
    };
    checkStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await signIn.email({
        password,
      });

      if (authError) {
        setError(authError.message || "Authorization Failed");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Tactical link failure. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card border p-8 rounded-2xl shadow-xl glassmorphism relative overflow-hidden">
        <ToneToggle />
        
        {/* Header Section */}
        <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto border border-primary/30">
                <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase italic">Command Center</h1>
            <p className="text-muted-foreground text-sm font-medium">Authorize access to ZMS Vault</p>
        </div>

        {/* Initialization Warning */}
        {isInitialized === false && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-500">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider">System Uninitialized</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                No {labels.commander.toLowerCase()} detected. You must run the {labels.setup.toLowerCase()} before signing in.
              </p>
              <Link href="/setup" className="inline-flex items-center text-[10px] font-black uppercase text-amber-500 hover:underline pt-1">
                Initialize System <ArrowRight className="ml-1 w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{labels.password}</label>
            </div>
            <div className="relative">
              <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder={labels.placeholders.password}
                className="pl-10 h-10 rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] rounded-lg font-bold uppercase italic tracking-wide">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 rounded-lg font-black uppercase tracking-wider italic shadow-lg shadow-primary/20"
            disabled={loading || isInitialized === false}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Authorize Access"}
          </Button>
        </form>

        <div className="text-center space-y-4 pt-2">
           <Link 
            href="/recovery" 
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors opacity-60"
          >
            Forgot tactical key? Run Recovery
          </Link>

          <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-relaxed">
            Zero-Knowledge Protocol v1.1 <br />
            Data encrypted at storage layer
          </p>
        </div>
      </div>
    </div>
  );
}

function Badge({ className, children, variant }: any) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
