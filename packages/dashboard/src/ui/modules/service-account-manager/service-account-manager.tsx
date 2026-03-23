"use client";

import { useServiceAccounts } from "@/application/hooks/use-service-accounts";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Badge } from "@/ui/components/badge";
import { Skeleton } from "@/ui/components/skeleton";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/ui/components/table";
import { 
    Plus, 
    Search, 
    ShieldCheck, 
    ShieldAlert, 
    Key, 
    Trash2, 
    Settings2,
    Clock,
    UserCircle,
    Server
} from "lucide-react";

interface ServiceAccountManagerProps {
    orgId: string;
}

export function ServiceAccountManager({ orgId }: ServiceAccountManagerProps) {
    const { 
        accounts, 
        isLoading, 
        searchTerm, 
        setSearchTerm, 
        revoke,
        hasAccounts 
    } = useServiceAccounts(orgId);

    return (
        <div className="space-y-10">
            {/* Header: Search & Action */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-lg w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
                    <Input 
                        placeholder="Search machine identities..." 
                        className="pl-12 h-12 bg-muted/20 border-none rounded-2xl focus:bg-muted/30 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
                    <Plus className="w-4 h-4" />
                    New account
                </Button>
            </div>

            {/* List Console */}
            <div className="rounded-[2.5rem] border bg-card/10 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/20">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-b-white/[0.05]">
                            <TableHead className="text-[10px] uppercase font-black tracking-widest px-8 h-14">Machine Identity</TableHead>
                            <TableHead className="text-[10px] uppercase font-black tracking-widest px-8 h-14">Auth Method</TableHead>
                            <TableHead className="text-[10px] uppercase font-black tracking-widest px-8 h-14 text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="px-8 py-6"><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="px-8 py-6"><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="px-8 py-6"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <>
                                {accounts.map((account) => (
                                    <TableRow key={account.id} className="group hover:bg-white/[0.02] border-b-white/[0.05] transition-colors duration-200">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                                                    <Server className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-black text-sm tracking-tight">{account.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                                                        {account.id.split("-")[0]}...
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Key className="w-3 h-3 text-primary opacity-50" />
                                                    <span className="text-[11px] font-bold text-foreground capitalize">{account.authMethod.replace("_", " ")}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-muted-foreground opacity-30" />
                                                    <span className="text-[9px] text-muted-foreground">Used {new Date(account.lastUsedAt || account.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                <Badge className={`text-[10px] font-black uppercase tracking-tighter ${
                                                    account.status === 'active' 
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                    {account.status}
                                                </Badge>
                                                <button 
                                                    onClick={() => revoke(account.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Empty State */}
            {!isLoading && !hasAccounts && (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-[3rem] border border-dashed border-muted/20">
                     <ShieldAlert className="w-16 h-16 text-muted-foreground opacity-10 mb-6" />
                     <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">No Service Accounts</p>
                     <p className="text-[11px] text-muted-foreground/60 mt-2">Start by creating a machine identity for your workflows</p>
                </div>
            )}
        </div>
    );
}
