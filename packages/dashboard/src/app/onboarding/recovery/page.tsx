"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useZmsStore } from "@/infrastructure/state/store";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/components/card";
import { ShieldCheck, Download, CheckCircle2, AlertTriangle, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { ZmsApiClient } from "@/infrastructure/api/api-client";

export default function RecoveryOnboardingPage() {
    const router = useRouter();
    const { activeOrg, tempRecoveryShards, setTempShards } = useZmsStore();
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isFetching = useRef(false);

    useEffect(() => {
        setMounted(true);

        const fetchShards = async () => {
            if (!tempRecoveryShards && !isFetching.current) {
                isFetching.current = true;
                try {
                    const response = await ZmsApiClient.get<{ success: boolean; data: { recoveryShards: string[] } }>("/onboarding/shards");
                    if (response.success) {
                        setTempShards(response.data.recoveryShards);
                    } else {
                        router.push(`/dashboard/${activeOrg?.id || 'default'}/projects`);
                    }
                } catch (e) {
                    // If 404/Error, assume already onboarded and go to dashboard
                    router.push(`/dashboard/${activeOrg?.id || 'default'}/projects`);
                }
            }
        };

        fetchShards();
    }, [tempRecoveryShards, router, setTempShards, activeOrg]);

    const handleDownload = () => {
        if (!tempRecoveryShards) return;

        setIsGenerating(true);
        setTimeout(() => {
            const element = document.createElement("a");
            const shardsText = tempRecoveryShards.map((s, i) => `Shard ${i + 1}: ${s}`).join("\n");
            const fileContent = `ZMS MASTER RECOVERY KEY (Shamir Secret Sharing)\n` +
                `Organization: ${activeOrg?.name}\n` +
                `Created: ${new Date().toISOString()}\n\n` +
                `THRESHOLD: 3-of-5\n\n` +
                `${shardsText}\n\n` +
                `KEEP THIS FILE SECURE. LOOSING THESE SHARDS MEANS LOOSING ACCESS TO YOUR SECRETS.`;

            const file = new Blob([fileContent], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = `zms-recovery-${activeOrg?.id || 'key'}.txt`;
            document.body.appendChild(element);
            element.click();

            setHasDownloaded(true);
            setIsGenerating(false);
            toast.success("Recovery key downloaded successfully!");
        }, 1000);
    };

    const handleProceed = () => {
        // Clear sensitive shards from memory
        setTempShards(null);
        router.push(`/dashboard/${activeOrg?.id}/projects`);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background flex items-center justify-center p-4">
            <Card className="w-full max-w-xl border-primary/10 shadow-2xl shadow-primary/5 backdrop-blur-sm bg-card/80 border-t-primary/20 overflow-hidden">
                <div className="h-1.5 w-full bg-muted overflow-hidden">
                    <div className={`h-full bg-primary transition-all duration-1000 ${hasDownloaded ? 'w-full' : 'w-1/2'}`} />
                </div>

                <CardHeader className="space-y-3 text-center pt-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-2 animate-in zoom-in-50 duration-500">
                        <Lock className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight">Master Recovery Key</CardTitle>
                    <CardDescription className="text-sm max-w-md mx-auto">
                        ZMS uses zero-knowledge encryption. This key is the only way to recover your workspace if you lose access. <span className="text-foreground font-bold">We do not store this key.</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 px-10">
                    <div className="p-6 rounded-2xl bg-muted/50 border-2 border-dashed border-primary/20 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                            <span>Secret Recovery Token</span>
                            <ShieldCheck className="w-3 h-3 text-primary" />
                        </div>
                        <div className="bg-background/80 p-4 rounded-xl font-mono text-[10px] text-left tracking-tight border shadow-inner max-h-32 overflow-y-auto space-y-1" suppressHydrationWarning>
                            {mounted && tempRecoveryShards ? tempRecoveryShards.map((s, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-muted last:border-0 pb-1 last:pb-0">
                                    <span className="opacity-50">#0{i + 1}:</span>
                                    <span className="truncate max-w-[200px]">{s.substring(0, 12)}...{s.substring(s.length - 8)}</span>
                                </div>
                            )) : "••••••••••••••••"}
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-600">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p className="text-[11px] leading-relaxed">
                            Store this key in a secure physical location or a hardware security module. Do not share it via email or plaintext messengers.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-10 pb-10">
                    {!hasDownloaded ? (
                        <>
                            <Button
                                onClick={handleDownload}
                                className="w-full h-14 text-md font-bold group shadow-lg shadow-primary/20 gap-3"
                                disabled={isGenerating}
                            >
                                {isGenerating ? "Generating Secure Token..." : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Download Recovery File
                                    </>
                                )}
                            </Button>
                            {showWarning ? (
                                <div className="w-full space-y-4 p-5 rounded-2xl border-2 border-destructive/40 bg-destructive/5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                                        <p className="text-[10px] text-destructive font-black uppercase text-center leading-relaxed tracking-tighter">
                                            CRITICAL WARNING: ZERO-KNOWLEDGE MEANS ZEXIO CANNOT RECOVER YOUR VAULT.<br />
                                            IF YOU LOSE THIS KEY, DATA IS <span className="underline decoration-2">PERMANENTLY LOST</span>.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 text-[10px] font-black uppercase border-destructive/30 text-destructive bg-transparent hover:bg-destructive/10 transition-all"
                                            onClick={() => setShowWarning(false)}
                                        >
                                            Abort
                                        </Button>
                                        <Button
                                            className="flex-1 h-12 text-[10px] font-black uppercase bg-destructive hover:bg-destructive/90 text-white shadow-xl shadow-destructive/30 transition-all active:scale-95"
                                            onClick={handleProceed}
                                        >
                                            Proceed at Risk
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowWarning(true)}
                                    className="w-full h-10 text-[10px] font-black opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive uppercase tracking-widest transition-colors"
                                >
                                    Skip & Risk Permanent Data Loss
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="w-full space-y-4 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4" />
                                Key Downloaded & Secured
                            </div>
                            <Button
                                onClick={handleProceed}
                                className="w-full h-14 text-md font-bold group shadow-lg shadow-primary/20 gap-3"
                            >
                                Enter your Workspace
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
