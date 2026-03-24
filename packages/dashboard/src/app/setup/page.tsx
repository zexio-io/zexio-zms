"use client";

import { useState, useEffect } from "react";
import { signUp } from "@/infrastructure/auth/auth-client";
import { useZmsStore, useUIStore } from "@/infrastructure/state/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { ToneToggle } from "@/ui/components/auth/tone-toggle";
import { UserPlus, Mail, Lock, User, Loader2, ShieldCheck, ArrowRight, ShieldAlert, Zap } from "lucide-react";

const getPasswordStrength = (pass: string) => {
  let score = 0;
  if (!pass) return { score: 0, label: "", color: "bg-transparent", textColor: "text-transparent" };
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  
  if (score <= 2) return { score: 2, label: "Weak Security", color: "bg-red-500", textColor: "text-red-500" };
  if (score === 3) return { score: 3, label: "Acceptable", color: "bg-yellow-500", textColor: "text-yellow-500" };
  if (score >= 4) return { score: 5, label: "Tactical Grade", color: "bg-green-500", textColor: "text-green-500" };
  return { score: 0, label: "", color: "bg-transparent", textColor: "text-transparent" };
};

import { getApiBaseUrl } from "@/infrastructure/utils/utils";

export default function SetupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { uiMode, setUiMode, getLabels } = useUIStore();
  const labels = getLabels();

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match. Tactical keys must be identical.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await signUp.email({
        email: "commander@local.zms", // Dummy email for Single-User ZMS CE
        password,
        name,
      });

      console.log("📝 Register Activity:", { success: !!data, error: authError });
      if (data) console.log("📦 Full Data Object:", JSON.stringify(data, null, 2));

      if (authError) {
        setError(authError.message || "Setup failed");
      } else {
        // Setup successful, shards will be in data
        // Save token to localStorage as fallback for ZmsApiClient
        if (data?.token) {
          localStorage.setItem('zms.session_token', data.token);
        }

        // Set active organization in store for subsequent navigation
        if (data?.data?.organizationId) {
          useZmsStore.getState().setOrg({
            id: data.data.organizationId,
            name: `${name}'s Workspace`
          });
        }

        // We have a session, proceed to onboarding recovery
        router.push("/onboarding/recovery");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card border p-8 rounded-2xl shadow-xl glassmorphism relative overflow-hidden">
        <ToneToggle />
        
        <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto border border-primary/30">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight uppercase ${uiMode === 'tactical' ? 'italic' : ''}`}>
              {labels.setup}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Initialize the Zexio Secure Ecosystem</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 pt-4">
          {isInitialized ? (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">System Initialized</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  Registration is locked for this ZMS Community Edition instance. 
                  Please sign in with the existing commander account.
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-primary/20 font-bold" onClick={() => router.push('/login')}>
                Go to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name / Alias</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={labels.placeholders.name}
                    className="pl-10 h-10 rounded-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{labels.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={labels.placeholders.password}
                    className="pl-10 h-10 rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {password && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                      <div 
                        className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                        style={{ width: `${(getPasswordStrength(password).score / 5) * 100}%` }}
                      />
                    </div>
                    <p className={`text-[10px] font-black text-right uppercase tracking-widest ${getPasswordStrength(password).textColor}`}>
                      {getPasswordStrength(password).label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirm Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Verify your tactical key"
                    className="pl-10 h-10 rounded-lg"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 rounded-lg font-black uppercase tracking-wider italic shadow-lg shadow-primary/20" disabled={loading || isInitialized === null}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Initialize Secure Vault"}
              </Button>
            </>
          )}
        </form>

        <p className="text-center text-xs text-muted-foreground pt-4">
          Already have an account? <a href="/login" className="text-primary hover:underline font-bold">Sign In</a>
        </p>
      </div>
    </div>
  );
}
