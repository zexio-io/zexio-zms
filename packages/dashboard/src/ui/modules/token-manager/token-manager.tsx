"use client";

import { useState } from "react";
import { useTokens } from "@/application/hooks/use-tokens";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Skeleton } from "@/ui/components/skeleton";
import { Badge } from "@/ui/components/badge";
import { 
    Key, 
    AtSign, 
    Trash2, 
    Plus, 
    CheckCircle2, 
    Copy, 
    Clock, 
    ShieldAlert,
    Eye,
    EyeOff
} from "lucide-react";
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
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/ui/components/select";
import { toast } from "sonner";

export function TokenManager({ orgId, projectId }: { orgId: string; projectId: string }) {
    const { tokens, isLoading, createToken, isCreating, revokeToken } = useTokens(orgId, projectId);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [tokenName, setTokenName] = useState("");
    const [tokenScope, setTokenScope] = useState<any>("read");
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);

    const handleCreate = async () => {
        try {
            const res: any = await createToken({ name: tokenName, scope: tokenScope });
            setGeneratedToken(res.data.token);
            setTokenName("");
        } catch (error) {
            toast.error("Failed to generate token");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
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
                        <Key className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest italic">Project Access Keys</h3>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={(o) => {
                    setIsCreateOpen(o);
                    if (!o) setGeneratedToken(null);
                }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl h-10 gap-2 px-6 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/10">
                            <Plus className="w-4 h-4" />
                            Generate Token
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-white/[0.05] bg-card/60 backdrop-blur-3xl shadow-2xl">
                        {!generatedToken ? (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black tracking-tight">Generate Service Token</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                        For machine-to-machine authentication
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-6 font-primary">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Token Identifier</label>
                                        <Input 
                                            placeholder="E.g. CI/CD Pipeline - Production" 
                                            className="h-14 rounded-2xl bg-background/50 border-white/5 focus:ring-primary text-sm font-medium"
                                            value={tokenName}
                                            onChange={(e) => setTokenName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Capability Scope</label>
                                        <Select value={tokenScope} onValueChange={setTokenScope}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-background/50 border-white/5 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-white/5 bg-black/95 backdrop-blur-3xl">
                                                <SelectItem value="read" className="rounded-xl focus:bg-primary/10 font-bold">Read-Only (Fetch Secrets)</SelectItem>
                                                <SelectItem value="write" className="rounded-xl focus:bg-primary/10 font-bold">Write (Rotate Secrets)</SelectItem>
                                                <SelectItem value="admin" className="rounded-xl focus:bg-primary/10 font-bold">Admin (Full Access)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="font-primary">
                                    <Button 
                                        className="w-full h-14 rounded-2xl text-lg font-black tracking-tight shadow-xl shadow-primary/10" 
                                        onClick={handleCreate}
                                        disabled={!tokenName || isCreating}
                                    >
                                        {isCreating ? "Deploying IAM..." : "Generate Key"}
                                    </Button>
                                </DialogFooter>
                            </>
                        ) : (
                            <div className="py-10 text-center space-y-6 animate-in zoom-in duration-300">
                                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight italic">Token Generated Successfully</h3>
                                    <p className="text-xs text-muted-foreground max-w-xs mx-auto italic">
                                        This secret will only be shown once. If lost, you must revoke and regenerate.
                                    </p>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all" />
                                    <div className="relative bg-background/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4">
                                        <code className="text-xs font-black tracking-widest text-primary break-all select-all font-mono">
                                            {generatedToken}
                                        </code>
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            onClick={() => copyToClipboard(generatedToken)}
                                            className="rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Copy Secret
                                        </Button>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full h-12 rounded-2xl" 
                                    variant="ghost" 
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Dismiss
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Token List */}
            <div className="grid gap-6">
                {tokens.length > 0 ? tokens.map((token) => (
                    <div key={token.id} className="p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-xl border-white/[0.05] relative overflow-hidden group hover:border-primary/20 transition-all duration-300 shadow-2xl shadow-black/40">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-background/50 border border-white/5 flex items-center justify-center text-primary shadow-xl shadow-black/40">
                                    <Key className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-black tracking-tight">{token.name}</p>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className="text-[9px] px-3 py-1 font-black uppercase tracking-widest rounded-lg bg-primary/10 text-primary border-none">
                                            {token.scope}
                                        </Badge>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">
                                            Last used {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-4 px-6 rounded-2xl bg-background/50 border border-white/5 hidden md:block">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mb-1">Created</p>
                                    <p className="text-[10px] font-black">{new Date(token.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={() => revokeToken(token.id)}
                                    className="h-14 px-6 rounded-2xl border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 text-red-500/40 hover:text-red-500 transition-all font-black uppercase text-[10px] tracking-widest group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Revoke Key
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 border border-dashed rounded-[3.5rem] border-white/5 flex flex-col items-center justify-center space-y-4 opacity-20">
                        <ShieldAlert className="w-12 h-12" />
                        <div className="text-center">
                            <p className="text-sm font-black uppercase tracking-widest italic">No access keys found in this project</p>
                            <p className="text-xs italic mt-1">Identity propagation is required for external service calls.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
