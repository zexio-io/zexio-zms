"use client";

import { useIdentitySecurity } from "@/application/hooks/use-identity-security";
import { Badge } from "@/ui/components/badge";
import { Skeleton } from "@/ui/components/skeleton";
import { Switch } from "@/ui/components/switch";
import { 
    ShieldCheck, 
    Smartphone, 
    Monitor, 
    Globe, 
    Clock, 
    XCircle, 
    Lock, 
    Fingerprint,
    History,
    LogOut,
    Activity
} from "lucide-react";

export function IdentityHardener() {
    const { 
        securityStatus, 
        isStatusLoading, 
        personalLogs, 
        isLogsLoading,
        revokeSession,
        isRevoking,
        toggleMfa
    } = useIdentitySecurity();

    if (isStatusLoading) {
        return (
            <div className="space-y-10">
                <Skeleton className="h-64 rounded-[2.5rem]" />
                <Skeleton className="h-96 rounded-[2.5rem]" />
            </div>
        );
    }

    if (!securityStatus) return null;

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* 1. MFA Control Center */}
            <div className="p-10 rounded-[3rem] bg-card/40 backdrop-blur-2xl border border-white/[0.05] relative overflow-hidden group shadow-2xl shadow-black/40">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full translate-x-32 -translate-y-32 blur-3xl" />
                
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                        <Fingerprint className="w-12 h-12" />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <h3 className="text-2xl font-black tracking-tight">Multi-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                            Add a tactical layer of protection to your account. When enabled, 
                            logins will require a temporary verification code from your authenticated device.
                        </p>
                    </div>
                    <div className="flex items-center gap-6 px-8 py-4 rounded-3xl bg-background/50 border border-white/5">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Protection Status</p>
                            <p className={`text-xs font-bold ${securityStatus.mfaEnabled ? 'text-green-500' : 'text-yellow-500'}`}>
                                {securityStatus.mfaEnabled ? 'OPERATIONAL' : 'VULNERABLE'}
                            </p>
                        </div>
                        <Switch 
                            checked={securityStatus.mfaEnabled} 
                            onCheckedChange={toggleMfa}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* 2. Active Session Management */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Active Radar (Sessions)</h3>
                    </div>

                    <div className="space-y-4">
                        {securityStatus.activeSessions.map((session) => (
                            <div key={session.id} className="p-6 rounded-[2rem] border bg-muted/5 border-white/[0.02] flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-background border border-white/5 flex items-center justify-center text-muted-foreground">
                                        {session.deviceType === 'desktop' ? <Monitor className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black tracking-tight">{session.userAgent.split(" (")[0]}</p>
                                            {session.isCurrent && (
                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase h-4 px-1.5">This device</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-40">
                                            <Globe className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">{session.ipAddress}</span>
                                            <span className="text-[10px] italic">• {session.location || 'Tactical HQ'}</span>
                                        </div>
                                    </div>
                                </div>
                                {!session.isCurrent && (
                                    <button 
                                        onClick={() => revokeSession(session.id)}
                                        disabled={isRevoking}
                                        className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Personal Security Log */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Incident History</h3>
                    </div>

                    <div className="rounded-[2.5rem] border bg-black/40 backdrop-blur-xl overflow-hidden min-h-[400px]">
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                           {isLogsLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                                ))
                           ) : (
                                personalLogs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between pb-4 border-b border-white/[0.02] last:border-0 group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                                log.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[11px] font-black uppercase tracking-tight">{log.action.replace("_", " ")}</p>
                                                <p className="text-[9px] text-muted-foreground opacity-40 font-mono italic">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-mono opacity-20 group-hover:opacity-100 transition-opacity">{log.ipAddress}</span>
                                    </div>
                                ))
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
