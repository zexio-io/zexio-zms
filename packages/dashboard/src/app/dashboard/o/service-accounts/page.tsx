"use client";

import { ShieldCheck, Lock, Zap, ArrowRight, User, Info, Building2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { ProjectHeader } from "@/ui/layouts/project-header";

export default function ServiceAccountsPage() {
    return (
        <div className="space-y-6">
            <ProjectHeader
                title="Service Accounts"
                description="Manage machine identities and automated access for your organization."
            />

            <div className="max-w-5xl space-y-8 pb-20">
                {/* Information Card */}
                <div className="p-6 rounded-xl border bg-card/40 backdrop-blur-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Organization Accounts</h3>
                            <p className="text-[11px] text-muted-foreground leading-none mt-1">Global machine identities for high-level orchestration.</p>
                        </div>
                    </div>
                    
                    <div className="p-12 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-4 bg-muted/5">
                        <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-muted-foreground">No Service Accounts found</p>
                            <p className="text-[11px] text-muted-foreground/60">Organization-wide service accounts are typically used for cross-project management.</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg font-bold">
                            Create Service Account
                        </Button>
                    </div>
                </div>

                {/* PRO UPSERLL - RBAC & Policy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2rem] border bg-card/10 border-white/[0.03] space-y-4 relative overflow-hidden group col-span-1 md:col-span-2">
                        <div className="absolute top-6 right-6 flex gap-2">
                            <Badge variant="outline" className="text-[9px] font-black border-primary/20 bg-primary/5 text-primary">ENTERPRISE</Badge>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-6">
                            <Building2 className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h5 className="font-black uppercase italic text-sm">Cross-Project RBAC</h5>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Assign identities that span multiple projects with granular permission sets and centralized management.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button variant="link" className="p-0 h-auto text-[10px] font-black uppercase text-primary tracking-widest group-hover:gap-2 transition-all">
                                Learn More <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer contextual help */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-primary/5">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-[10px] text-primary/80 leading-relaxed font-medium">
                        <strong>Note:</strong> Technical service accounts for specific projects should be managed within the project settings scope. These are global accounts for orchestration.
                    </p>
                </div>
            </div>
        </div>
    );
}