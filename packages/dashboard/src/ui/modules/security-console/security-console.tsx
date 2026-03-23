"use client";

import { useSecurity } from "@/application/hooks/use-security";
import { Badge } from "@/ui/components/badge";
import { Skeleton } from "@/ui/components/skeleton";
import { 
    RefreshCw, 
    History, 
    ShieldCheck, 
    AlertTriangle, 
    Clock, 
    Activity, 
    Database, 
    User,
    ArrowRight
} from "lucide-react";

interface SecurityConsoleProps {
    orgId: string;
    projectId?: string;
}

export function SecurityConsole({ orgId, projectId }: SecurityConsoleProps) {
    const { 
        auditLogs, 
        isLogsLoading, 
        rotationPolicies, 
        isRotationLoading,
        triggerRotation,
        isRotating
    } = useSecurity(orgId, projectId);

    return (
        <div className="grid lg:grid-cols-2 gap-10">
            {/* 1. Rotation Scheduler Console */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <RefreshCw className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-sm uppercase tracking-widest">Rotation Scheduler</h3>
                </div>

                <div className="space-y-4">
                    {isRotationLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-[2rem]" />
                        ))
                    ) : (
                        <>
                            {rotationPolicies.length === 0 && (
                                <div className="p-10 rounded-[2.5rem] border border-dashed border-muted/20 flex flex-col items-center justify-center text-center bg-muted/5">
                                    <Clock className="w-10 h-10 text-muted-foreground opacity-20 mb-4" />
                                    <p className="text-xs font-bold text-muted-foreground">No active rotation policies</p>
                                </div>
                            )}
                            {rotationPolicies.map((policy) => (
                                <div key={policy.id} className="p-8 rounded-[2.5rem] border bg-card/10 backdrop-blur-xl group hover:border-primary/40 transition-all duration-500">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic">{policy.provider} Provider</p>
                                            <h4 className="font-black text-lg tracking-tight">{policy.targetId.split("-")[0]}... Vault</h4>
                                        </div>
                                        <Badge className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black uppercase h-6">
                                            {policy.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40">Next Rotation</p>
                                                <p className="text-[11px] font-bold">{new Date(policy.nextRotationAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="w-px h-6 bg-white/[0.05]" />
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40">Frequency</p>
                                                <p className="text-[11px] font-bold">{policy.frequencyDays} Days</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => triggerRotation(policy.id)}
                                            disabled={isRotating}
                                            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all group-hover:scale-110"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isRotating ? "animate-spin" : ""}`} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* 2. Audit Event Stream */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-sm uppercase tracking-widest">Immutable Audit Stream</h3>
                </div>

                <div className="rounded-[2.5rem] border bg-black/40 backdrop-blur-3xl overflow-hidden min-h-[500px] flex flex-col shadow-2xl shadow-black/40">
                    <div className="p-4 bg-muted/20 border-b border-white/[0.05] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Live feed</span>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground/40">{auditLogs.length} Events Logged</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {isLogsLoading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                            ))
                        ) : (
                            <>
                                {auditLogs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-30">
                                        <Database className="w-10 h-10 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-tighter">No events captured</p>
                                    </div>
                                )}
                                {auditLogs.map((log) => (
                                    <div key={log.id} className="flex gap-4 group">
                                        <div className="relative">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full shadow-[0_0_10px_rgba(var(--severity-color),0.5)] ${
                                                log.severity === 'critical' ? 'bg-red-500' : 
                                                log.severity === 'warning' ? 'bg-yellow-500' : 'bg-primary'
                                            }`} />
                                            <div className="absolute top-4 left-[3px] w-[2px] h-full bg-white/[0.03] group-last:hidden" />
                                        </div>
                                        <div className="flex-1 space-y-1 pb-4 border-b border-white/[0.02]">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-black text-foreground selection:bg-primary">
                                                    {log.action.replace("_", " ")}
                                                </p>
                                                <span className="text-[9px] font-medium text-muted-foreground font-mono opacity-40">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-60">
                                                <User className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">{log.actorName}</span>
                                                <ArrowRight className="w-3 h-3 opacity-20" />
                                                <span className="text-[10px] font-mono text-primary/80">{log.targetId.split("-")[0]}...</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
