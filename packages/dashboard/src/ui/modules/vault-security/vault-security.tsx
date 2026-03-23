"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Sparkles 
} from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Card } from "@/ui/components/card";
import { toast } from "sonner";

export function VaultSecurity() {
  const [step, setStep] = useState<"idle" | "form" | "rotating" | "success">("idle");
  const [currentKey, setCurrentKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [confirmKey, setConfirmKey] = useState("");
  const [mfaVerified, setMfaVerified] = useState(false);

  const handleStartRotation = () => {
    if (!currentKey || !newKey || newKey !== confirmKey) {
      toast.error("Please fill all fields correctly.");
      return;
    }
    
    setStep("rotating");
    
    setTimeout(() => {
      setStep("success");
      toast.success("Master Key rotated successfully!");
    }, 3000);
  };

  const handleExportRecovery = () => {
    toast.info("Exporting Recovery Key...");
    // Mock download
    setTimeout(() => {
        const element = document.createElement("a");
        const file = new Blob(["ZMS MASTER RECOVERY KEY\n..."], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `zms-recovery-key-export.txt`;
        document.body.appendChild(element);
        element.click();
        toast.success("Recovery Key exported successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-10">
      {/* 1. Rotations Orchestrator Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tighter">Rotations Orchestrator</h2>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Manage tactical secret rotations and strategic workspace-level encryption.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="h-10 rounded-full px-6 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">
            Resource Rotations
        </Button>
        <Button className="h-10 rounded-full px-6 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
            Vault & Master Key
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Administrative MFA Section */}
        <div className="p-10 rounded-[2.5rem] bg-muted/30 border border-white/[0.05] space-y-8 flex flex-col justify-between">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
                    <div className="w-7 h-10 border-2 border-muted-foreground/30 rounded-md flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-muted-foreground/20" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h4 className="text-md font-black">Administrative MFA</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">Required to unlock high-stakes Vault operations.</p>
                </div>
            </div>

            <div className="bg-background/80 p-6 rounded-[2rem] border border-border flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all" onClick={() => setMfaVerified(!mfaVerified)}>
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${mfaVerified ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground/30'}`} />
                    <span className="text-xs font-black uppercase tracking-widest opacity-70">Verification Required</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                    {mfaVerified ? 'VERIFIED' : 'MANAGE'}
                </span>
            </div>
        </div>

        {/* 3. Vault Warning Card */}
        <div className="p-10 rounded-[2.5rem] bg-amber-500/[0.03] border border-amber-500/10 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-background border border-amber-500/20 flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-6 h-6 text-amber-500/80" />
            </div>
            <div className="space-y-2">
                <h4 className="text-md font-black text-amber-600/90">Vault Warning</h4>
                <p className="text-[11px] text-amber-600/70 leading-relaxed font-medium">
                    Rotating the Master Key is a destructive operation that invalidates all previous recovery backups. 
                    Ensure you have physical access to your identity hardware.
                </p>
            </div>
        </div>

        {/* 4. Recovery Key Card */}
        <div className="p-10 rounded-[2.5rem] bg-card/40 backdrop-blur-sm border border-border/50 flex flex-col justify-between gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest opacity-80 italic">Recovery Key</h4>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium opacity-70 text-balance">
                    Export your organization's Master Recovery Key. This script is needed to decrypt vault data if root access is lost.
                </p>
            </div>
            <Button 
                variant="outline" 
                onClick={handleExportRecovery}
                className="h-12 w-full rounded-2xl border-white/[0.05] hover:border-primary/30 bg-background/50 text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 group"
                disabled={!mfaVerified}
            >
                <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                Export Master Key (.txt)
            </Button>
        </div>

        {/* 5. Master Rotation Card */}
        <div className="p-10 rounded-[2.5rem] bg-card/40 backdrop-blur-sm border border-border/50 flex flex-col justify-between gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest opacity-80 italic">Master Rotation</h4>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium opacity-70">
                    Initiate a global re-encryption of all project secrets with a new cryptographic root.
                </p>
            </div>
            <Button 
                variant="outline"
                onClick={() => setStep("form")}
                className="h-12 w-full rounded-2xl border-white/[0.05] hover:border-primary/30 bg-background/50 text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 group"
                disabled={!mfaVerified}
            >
                <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-700" />
                Initiate Master Rotation
            </Button>
        </div>
      </div>

      {/* Rotation Modal Overlay */}
      <AnimatePresence>
        {step !== "idle" && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl"
            >
                <Card className="w-full max-w-lg border-2 border-primary/20 shadow-2xl overflow-hidden bg-card/90 backdrop-blur-md rounded-[3rem]">
                    <div className="p-10 space-y-8">
                        {step === "form" && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Execute Rotation</h3>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Protocol V4 Signature Required</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Current Master Key</label>
                                        <Input type="password" placeholder="••••••••••••••••" value={currentKey} onChange={(e) => setCurrentKey(e.target.value)} className="h-14 bg-background/50 rounded-2xl border-white/[0.05]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">New Master Key</label>
                                        <Input type="password" placeholder="••••••••••••••••" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="h-14 bg-background/50 rounded-2xl border-primary/10 transition-all focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Confirm New Key</label>
                                        <Input type="password" placeholder="••••••••••••••••" value={confirmKey} onChange={(e) => setConfirmKey(e.target.value)} className="h-14 bg-background/50 rounded-2xl border-primary/10 transition-all focus:border-primary/50" />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button onClick={handleStartRotation} className="flex-1 h-16 font-black uppercase tracking-tighter text-md rounded-2xl group shadow-lg shadow-primary/20">
                                        Sign & Rotate
                                    </Button>
                                    <Button variant="ghost" onClick={() => setStep("idle")} className="h-16 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">
                                        ABORT
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === "rotating" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-8">
                                <div className="relative">
                                    <Loader2 className="w-20 h-20 text-primary animate-spin" />
                                    <Lock className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h4 className="text-2xl font-black uppercase italic tracking-tighter">Recertifying Vault</h4>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">
                                        Re-wrapping Global Root Keys
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === "success" && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 space-y-8">
                                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shadow-2xl shadow-green-500/20 ring-4 ring-green-500/5">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h4 className="text-3xl font-black uppercase italic tracking-tighter">Rotation Complete</h4>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-70">All identity wrappers updated.</p>
                                </div>
                                <Button onClick={() => setStep("idle")} className="h-16 px-12 font-black uppercase tracking-tighter text-md rounded-2xl">
                                    Dismiss Protocol
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
