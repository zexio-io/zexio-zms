"use client";

import { useState } from "react";
import { useWebhooks } from "@/application/hooks/use-webhooks";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { Input } from "@/ui/components/input";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/ui/components/dialog";
import { 
    Webhook as WebhookIcon, 
    Zap, 
    Activity, 
    Trash2, 
    Plus, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    ShieldAlert
} from "lucide-react";

export function WebhookManager({ orgId }: { orgId: string }) {
    const { webhooks, isLoading, createWebhook, isCreating, deleteWebhook } = useWebhooks(orgId);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [webhookDesc, setWebhookDesc] = useState("");

    if (isLoading) {
        return (
            <div className="grid lg:grid-cols-2 gap-8">
                <Skeleton className="h-48 rounded-[2rem]" />
                <Skeleton className="h-48 rounded-[2rem]" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header + Create Action */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Active Hooks</h3>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl h-10 gap-2 px-6 font-black uppercase text-xs tracking-widest">
                            <Plus className="w-4 h-4" />
                            Create Hook
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-white/[0.05] bg-card/60 backdrop-blur-3xl shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight">Deploy New Hook</DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                Real-time event orchestration
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-6 font-primary">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Endpoint Destination</label>
                                <Input 
                                    placeholder="https://your-api.com/webhooks/zms" 
                                    className="h-14 rounded-2xl bg-background/50 border-white/5 focus:ring-primary text-sm font-medium"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Operational Alias</label>
                                <Input 
                                    placeholder="Production Event Sink" 
                                    className="h-14 rounded-2xl bg-background/50 border-white/5 focus:ring-primary text-sm font-medium"
                                    value={webhookDesc}
                                    onChange={(e) => setWebhookDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="font-primary">
                            <Button 
                                className="w-full h-14 rounded-2xl text-lg font-black tracking-tight shadow-xl shadow-primary/10" 
                                onClick={() => createWebhook({ url: webhookUrl, description: webhookDesc }, { onSuccess: () => setIsCreateOpen(false) })}
                                disabled={!webhookUrl || isCreating}
                            >
                                {isCreating ? "Initializing..." : "Activate Hook"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Hook List Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {webhooks.length > 0 ? webhooks.map((hook) => (
                    <div key={hook.id} className="p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-xl border-white/[0.05] relative overflow-hidden group hover:border-primary/20 transition-all duration-300 shadow-2xl shadow-black/40">
                        <div className="absolute top-0 right-0 p-8">
                            <button 
                                onClick={() => deleteWebhook(hook.id)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                    hook.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                } shadow-xl`}>
                                    <WebhookIcon className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-black tracking-tight">{hook.description || 'Unnamed Hook'}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground opacity-60 truncate max-w-[200px]">{hook.url}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-background/50 border border-white/5 space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${hook.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                        <p className="text-[10px] font-black uppercase">{hook.status}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-background/50 border border-white/5 space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Security</p>
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="w-3 h-3 text-primary" />
                                        <p className="text-[10px] font-black uppercase tracking-tighter truncate">AES-GCM Signed</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground opacity-40">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    <span>Last fired: {hook.lastFiredAt ? new Date(hook.lastFiredAt).toLocaleString() : 'Never'}</span>
                                </div>
                                <Activity className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="lg:col-span-2 p-20 border border-dashed rounded-[3rem] border-white/5 flex flex-col items-center justify-center space-y-4 opacity-20">
                        <WebhookIcon className="w-16 h-16" />
                        <div className="text-center">
                            <p className="text-sm font-black uppercase tracking-widest">No active hooks detected</p>
                            <p className="text-xs italic mt-1 font-medium">Orchestrate your secrets lifecycle with external services.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
