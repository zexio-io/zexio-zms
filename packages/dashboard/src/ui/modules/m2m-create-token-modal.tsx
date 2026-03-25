"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogDescription 
} from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import { Key, Plus, Copy, Check, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
import { useZmsStore } from "@/infrastructure/state/store";

export function CreateTokenModal({ children, onSuccess }: { children: React.ReactNode, onSuccess?: () => void }) {
    const params = useParams();
    const { activeOrg, activeProject } = useZmsStore();
    const orgId = resolveOrgId(params.orgId, activeOrg?.id);
    const projectId = resolveProjectId(params.projectId, activeProject?.id);

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tokenData, setTokenData] = useState<{ token: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const { data: services } = useQuery({
        queryKey: ["project_services", projectId],
        queryFn: () => ZmsApiClient.get<{ data: any[] }>(`/projects/${projectId}/services`),
        enabled: open && !params.serviceId
    });

    const { data: envsData } = useQuery({
        queryKey: ["project_envs", projectId],
        queryFn: () => ZmsApiClient.get<{ data: any[] }>(`/projects/${projectId}/environments`),
        enabled: open
    });

    // Logical Sorting for Environments
    const envPriority = ["development", "staging", "sandbox", "production"];
    const envs = envsData?.data.sort((a, b) => {
        const aIdx = envPriority.indexOf(a.name.toLowerCase());
        const bIdx = envPriority.indexOf(b.name.toLowerCase());
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.name.localeCompare(b.name);
    }) || [];

    const [form, setForm] = useState({
        name: "",
        serviceId: (params.serviceId as string) || "",
        environmentId: "",
    });

    const handleCreate = async () => {
        if (!form.name || !form.environmentId || !form.serviceId) {
            toast.error("Please fill in all fields (Name, Service, and Environment)");
            return;
        }

        setLoading(true);
        try {
            const res = await ZmsApiClient.post<{ token: string }>(`/service-tokens`, {
                ...form,
                projectId: projectId,
                organizationId: orgId,
            });
            setTokenData(res);
            toast.success("Service Token generated successfully!");
            onSuccess?.();
        } catch (e: any) {
            toast.error(e.message || "Failed to generate token");
        } finally {
            setLoading(false);
        }
    }

    const copyToClipboard = () => {
        if (tokenData) {
            navigator.clipboard.writeText(tokenData.token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setTokenData(null);
                setForm({
                    name: "",
                    serviceId: (params.serviceId as string) || "",
                    environmentId: "",
                });
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-primary/10 rounded-[32px] overflow-hidden">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        <Key className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-2xl font-black">Generate Service Token</DialogTitle>
                    <DialogDescription>
                        Create a scoped token for local development or individual machine access.
                    </DialogDescription>
                </DialogHeader>

                {!tokenData ? (
                    <form 
                        className="space-y-6 py-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCreate();
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-60">Token Name</Label>
                            <Input 
                                id="name" 
                                placeholder="e.g. My Mac Mini" 
                                className="rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                autoFocus
                            />
                        </div>

                        {!params.serviceId && (
                            <div className="space-y-2">
                                <Label htmlFor="service" className="text-xs font-bold uppercase tracking-wider opacity-60">Service</Label>
                                <Select onValueChange={(val) => setForm({ ...form, serviceId: val })}>
                                    <SelectTrigger className="rounded-xl bg-muted/30 border-none">
                                        <SelectValue placeholder="Select service" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {services?.data.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="env" className="text-xs font-bold uppercase tracking-wider opacity-60">Environment</Label>
                            <Select onValueChange={(val) => setForm({ ...form, environmentId: val })}>
                                <SelectTrigger className="rounded-xl bg-muted/30 border-none">
                                    <SelectValue placeholder="Select target environment" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {envs.map((e: any) => (
                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button 
                            type="submit"
                            className="w-full rounded-2xl h-12 font-black shadow-lg shadow-primary/20" 
                            disabled={loading}
                        >
                            {loading ? "Generating..." : "Generate Token"}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-6 py-4 animate-in zoom-in-95 duration-300">
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0" />
                            <p className="text-[11px] text-orange-500 font-medium leading-relaxed">
                                **WARNING**: This token will only be shown once. Please copy it immediately and store it in a secure location.
                            </p>
                        </div>

                        <div className="relative">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest pl-1">Service Token</Label>
                            <div className="mt-1 flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-muted-foreground/10 font-mono text-sm break-all">
                                {tokenData.token}
                                <Button size="icon" variant="ghost" className="shrink-0" onClick={copyToClipboard}>
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full rounded-2xl" onClick={() => setOpen(false)}>
                            I have saved my token
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
