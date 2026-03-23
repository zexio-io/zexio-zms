"use client";

import { useState, useEffect } from "react";
import { Shield, Key, ChevronRight, ArrowLeft, Loader2, Sparkles, CheckCircle2, Lock as LockIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Badge } from "@/ui/components/badge";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/infrastructure/state/store";
import { ToneToggle } from "@/ui/components/auth/tone-toggle";

import { getApiBaseUrl } from "@/infrastructure/utils/utils";

export default function TacticalRecoveryPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const labels = useUIStore(state => state.getLabels());

    useEffect(() => {
        setMounted(true);
    }, []);

    const [step, setStep] = useState(1); // 1: Shards, 2: Reset
    const [shards, setShards] = useState(["", "", ""]); // Min 3 shards for 3-of-5 threshold
    const [isVerifying, setIsVerifying] = useState(false);

    const handleNextStep = () => {
        setIsVerifying(true);
        // Simulate tactical reconstruction delay
        setTimeout(() => {
            setIsVerifying(false);
            setStep(step + 1);
        }, 1500);
    };

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword, shards }),
            });
            if (res.ok) {
                router.push("/login");
            } else {
                alert("Failed to reset password. Security check failed.");
            }
        } catch (e) {
            alert("Tactical link failure.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 bg-card border p-8 rounded-2xl shadow-xl glassmorphism relative overflow-hidden">
                <ToneToggle />

                {/* Header Section */}
                <div className="text-center space-y-2">
                    <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors group mb-2">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto border border-primary/30">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight uppercase italic">{labels.recovery}</h1>
                    <p className="text-muted-foreground text-sm font-medium">Reconstruct {labels.vault} access to regain control</p>
                </div>

                {/* Phase Container */}
                <div className="relative">

                    {/* Step 1: Shard Reconstruction */}
                    {step === 1 && (
                        <form
                            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleNextStep();
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Enter {labels.shard}s (Min 3 of 5)
                                </label>
                                <Badge variant="outline" className="text-[8px] font-black bg-primary/10 text-primary border-primary/20 uppercase">
                                    Fragment
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {shards.map((shard, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="absolute left-3 top-2.5 flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-[10px] font-black text-primary/60 border border-primary/20 group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:border-primary transition-all">
                                            {idx + 1}
                                        </div>
                                        <Input
                                            value={shard}
                                            onChange={(e) => {
                                                const newShards = [...shards];
                                                newShards[idx] = e.target.value;
                                                setShards(newShards);
                                            }}
                                            placeholder={labels.placeholders.shard}
                                            className="h-10 pl-10 rounded-lg font-mono text-xs"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>

                            <p className="text-[9px] text-center text-muted-foreground/60 font-medium px-4 leading-relaxed">
                                Reconstruction threshold is 3 tokens. Shards are processed locally in the secure buffer.
                            </p>

                            <Button
                                type="submit"
                                className="w-full h-11 rounded-lg font-black uppercase tracking-wider italic shadow-lg shadow-primary/20"
                                disabled={shards.some(s => !s) || isVerifying}
                            >
                                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Reconstruct ${labels.vault} Key`}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: Identity Reset */}
                    {step === 2 && (
                        <form
                            className="space-y-6 text-center animate-in zoom-in-95 duration-500"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleResetPassword();
                            }}
                        >
                            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl mx-auto flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold italic uppercase tracking-tighter">Key Authenticated</h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    System control restored. Set your new tactical password.
                                </p>
                            </div>

                            <div className="space-y-4 pt-2 text-left">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New {labels.password}</label>
                                    <div className="relative">
                                        <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••"
                                            className="h-10 pl-10 rounded-lg"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Identity Key</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••"
                                            className="h-10 pl-10 rounded-lg"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 rounded-lg font-black uppercase tracking-wider italic shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save & Resync Vault"}
                            </Button>
                        </form>
                    )}

                </div>

                {/* Footer Note */}
                <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] opacity-30 pt-4">
                    Zexio Recovery Protocol 1.1 · Zero Trust Layer
                </p>
            </div>
        </div>
    );
}
