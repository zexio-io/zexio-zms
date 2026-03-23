"use client";

import { useState } from "react";
import { useOnboarding } from "@/application/hooks/use-onboarding";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { 
    ShieldCheck, 
    Building2, 
    Rocket, 
    ChevronRight, 
    CheckCircle2, 
    Globe, 
    Box, 
    ArrowRight
} from "lucide-react";

export function OnboardingWizard() {
    const { state, setStep, completeOnboarding, isSubmitting } = useOnboarding();
    const [orgName, setOrgName] = useState("");
    const [projectName, setProjectName] = useState("");

    const handleOrgSubmit = () => {
        if (orgName) setStep("create-project");
    };

    const handleFinalSubmit = () => {
        completeOnboarding({ orgName, projectName });
    };

    return (
        <div className="max-w-2xl mx-auto py-20 px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* 1. Progress Indicator */}
            <div className="flex items-center justify-between mb-16 px-4">
                {["welcome", "create-org", "create-project", "recovery-kit", "complete"].map((s, idx) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-2xl ${
                            state.currentStep === s ? 'bg-primary text-primary-foreground border-primary scale-110' : 
                            ["welcome", "create-org", "create-project", "recovery-kit", "complete"].indexOf(state.currentStep) > idx ? 
                            'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted/5 text-muted-foreground border-white/5'
                        }`}>
                            {["welcome", "create-org", "create-project", "recovery-kit", "complete"].indexOf(state.currentStep) > idx ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <span className="text-xs font-black">{idx + 1}</span>
                            )}
                        </div>
                        {idx < 4 && <div className="w-12 h-[2px] mx-2 bg-white/[0.03]" />}
                    </div>
                ))}
            </div>

            {/* 2. Step: Welcome */}
            {state.currentStep === "welcome" && (
                <div className="text-center space-y-10 animate-in zoom-in duration-500">
                    <div className="relative mx-auto w-32 h-32">
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                        <div className="relative bg-card/60 backdrop-blur-2xl border border-white/10 w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-primary shadow-2xl">
                             <ShieldCheck className="w-16 h-16" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-6xl font-black tracking-tighter italic">Welcome to ZMS.</h1>
                        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed italic opacity-80 font-medium">
                            The next generation of secret management is now under your command. 
                            Let's initialize your tactical environment.
                        </p>
                    </div>
                    <Button 
                        onClick={() => setStep("create-org")}
                        className="h-16 px-12 rounded-[2rem] text-xl font-black italic tracking-tight shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all group"
                    >
                        Initialize Shell
                        <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}

            {/* 3. Step: Create Org */}
            {state.currentStep === "create-org" && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black tracking-tighter italic">Establish Your Organization</h2>
                        <p className="text-muted-foreground text-sm uppercase font-black tracking-widest opacity-60">Mission Control Center</p>
                    </div>

                    <div className="space-y-8 p-10 rounded-[3rem] border bg-card/10 backdrop-blur-2xl border-white/[0.05] shadow-2xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Legal Entity / Organization Name</label>
                            </div>
                            <Input 
                                placeholder="E.g. Zexio Labs"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="h-16 rounded-2xl bg-black/20 border-white/5 font-bold text-xl px-6"
                            />
                        </div>

                        <Button 
                            onClick={handleOrgSubmit}
                            disabled={!orgName}
                            className="w-full h-16 rounded-2xl text-xl font-black italic shadow-2xl shadow-primary/10"
                        >
                            Next Step
                        </Button>
                    </div>
                </div>
            )}

            {/* 4. Step: Create Project */}
            {state.currentStep === "create-project" && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black tracking-tighter italic">First Project</h2>
                        <p className="text-muted-foreground text-sm uppercase font-black tracking-widest opacity-60">Secrets Habitat</p>
                    </div>

                    <div className="space-y-8 p-10 rounded-[3rem] border bg-card/10 backdrop-blur-2xl border-white/[0.05] shadow-2xl">
                        <div className="space-y-4 text-center pb-4">
                            <div className="mx-auto w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Box className="w-12 h-12" />
                            </div>
                            <p className="text-muted-foreground text-sm italic">
                                Projects act as isolated vaults for your applications. 
                                Give your first project a tactical name.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 pl-2">Project Name</label>
                            <Input 
                                placeholder="E.g. Core API - Production"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="h-16 rounded-2xl bg-black/20 border-white/5 font-bold text-xl px-6 text-center"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant="ghost" 
                                onClick={() => setStep("create-org")}
                                className="h-16 rounded-2xl text-lg font-black opacity-40 hover:opacity-100"
                            >
                                Back
                            </Button>
                            <Button 
                                onClick={handleFinalSubmit}
                                disabled={!projectName || isSubmitting}
                                className="h-16 rounded-2xl text-xl font-black italic shadow-2xl shadow-primary/10"
                            >
                                {isSubmitting ? "Finalizing..." : "Launch Command"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4.5. Step: Recovery Kit */}
            {state.currentStep === "recovery-kit" && (
                <div className="space-y-10 animate-in zoom-in duration-500">
                    <div className="space-y-2 text-center">
                        <h2 className="text-4xl font-black tracking-tighter italic text-primary">Tactical Recovery Kit</h2>
                        <p className="text-muted-foreground text-sm uppercase font-black tracking-widest opacity-60">Sovereign Backup Shards</p>
                    </div>

                    <div className="space-y-8 p-10 rounded-[3rem] border bg-card/20 backdrop-blur-3xl border-primary/20 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck className="w-32 h-32" />
                        </div>
                        
                        <div className="space-y-4 italic text-center text-sm text-muted-foreground">
                            <p>We've generated 5 cryptographic shards using Shamir Secret Sharing.</p>
                            <p className="font-bold text-white/80">Keep these offline. You need 3/5 shards to recover your vault if you lose your Master Key.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {state.recoveryShards?.map((shard, i) => (
                                <div key={i} className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-[10px] group transition-all">
                                    <span className="text-primary font-black opacity-50">SHARD_{i+1}</span>
                                    <span className="flex-1 truncate opacity-30 group-hover:opacity-100 transition-opacity">
                                        {shard}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <Button 
                                onClick={() => {
                                    const data = JSON.stringify({
                                        org: state.orgId,
                                        shards: state.recoveryShards,
                                        timestamp: new Date().toISOString(),
                                        note: "ZMS Recovery Kit. Keep Offline. 3/5 Quorum required."
                                    }, null, 2);
                                    const blob = new Blob([data], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `zms-recovery-kit-${state.orgId}.json`;
                                    a.click();
                                    setStep("complete");
                                }}
                                className="w-full h-16 rounded-2xl text-xl font-black italic bg-primary shadow-2xl shadow-primary/20 group"
                            >
                                <Rocket className="w-6 h-6 mr-2 group-hover:-translate-y-1 transition-transform" />
                                Download & Decouple
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Step: Complete */}
            {state.currentStep === "complete" && (
                <div className="text-center space-y-10 animate-in zoom-in-50 duration-700">
                    <div className="relative mx-auto w-32 h-32">
                        <div className="absolute inset-0 bg-green-500/20 blur-[60px] rounded-full animate-pulse" />
                        <div className="relative bg-card/60 backdrop-blur-2xl border border-green-500/10 w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-green-500 shadow-2xl">
                             <Rocket className="w-16 h-16 animate-bounce" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-6xl font-black tracking-tighter italic">Mission Launch.</h1>
                        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed italic opacity-80 font-medium font-primary">
                            Your organization and project have been successfully provisioned. 
                            Entering control center in 3, 2, 1...
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                        <span className="w-10 h-px bg-primary/20" />
                        System Synchronized
                        <span className="w-10 h-px bg-primary/20" />
                    </div>
                </div>
            )}
        </div>
    );
}
