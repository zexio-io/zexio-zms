"use client";

import { RefreshCw, Shield, ArrowRight, Zap, Info, Building2, Clock } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { ProjectHeader } from "@/ui/layouts/project-header";

export default function RotationPage() {
    return (
        <div className="space-y-6">
            <ProjectHeader
                title="Automated Rotations"
                description="Eliminate the risk of stale credentials with zero-downtime automated rotation policies."
            />

            <div className="max-w-5xl space-y-8 pb-20">
                {/* Information Card */}
                <div className="p-6 rounded-xl border bg-card/40 backdrop-blur-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Rotation Policies</h3>
                            <p className="text-[11px] text-muted-foreground leading-none mt-1">Configure automated lifecycle management for your organization secrets.</p>
                        </div>
                    </div>
                    
                    <div className="p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-4 bg-muted/5">
                        <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-muted-foreground">No active rotation policies</p>
                            <p className="text-[11px] text-muted-foreground/60">Automated rotation is typically configured at the resource or project level.</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg font-bold">
                            Configure Global Policy
                        </Button>
                    </div>
                </div>

                {/* PRO UPSERLL - Advanced Rotation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2rem] border bg-card/10 border-white/[0.03] space-y-4 relative overflow-hidden group">
                        <div className="absolute top-6 right-6 flex gap-2">
                            <Badge variant="outline" className="text-[9px] font-black border-primary/20 bg-primary/5 text-primary">ENTERPRISE</Badge>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-6">
                            <Building2 className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="font-black uppercase italic text-sm">Dynamic Secrets</h5>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Generate on-demand credentials for databases and cloud providers with just-in-time access control.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button variant="link" className="p-0 h-auto text-[10px] font-black uppercase text-primary tracking-widest group-hover:gap-2 transition-all">
                                Learn More <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2rem] border bg-card/10 border-white/[0.03] space-y-4 relative overflow-hidden group">
                        <div className="absolute top-6 right-6">
                            <Badge variant="outline" className="text-[9px] font-black border-purple-500/20 bg-purple-500/5 text-purple-400">PRO</Badge>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-6">
                            <Shield className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="font-black uppercase italic text-sm">Health Verification</h5>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Continuous verification of credential health before and after rotation events to ensure zero downtime system.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button variant="link" className="p-0 h-auto text-[10px] font-black uppercase text-primary tracking-widest group-hover:gap-2 transition-all">
                                Upgrade Now <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer contextual help */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-primary/5">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-[10px] text-primary/80 leading-relaxed font-medium">
                        <strong>Security Note:</strong> We recommend rotating secrets every 30-90 days depending on your compliance requirements. Global policies apply inherited rules to all children projects.
                    </p>
                </div>
            </div>
        </div>
    );
}