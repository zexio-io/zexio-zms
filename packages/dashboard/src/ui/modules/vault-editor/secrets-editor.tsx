"use client";

import { useEffect, useState } from "react";
import { useSecrets } from "@/application/hooks/use-secrets";
import { validateSecretKey } from "@/domain/entities/secret";
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
    TableRow,
} from "@/ui/components/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/ui/components/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/ui/components/alert-dialog";
import {
    Plus,
    Search,
    Shield,
    Eye,
    EyeOff,
    Save,
    Trash2,
    Lock,
    Unlock,
    AlertCircle,
    X,
    Pencil,
    ChevronDown,
    Copy,
    Layers,
    Loader2
} from "lucide-react";

interface SecretsEditorProps {
    orgId: string;
    projectId?: string;
    environment?: string;
    serviceId?: string;
    isLocal?: boolean;
    availableEnvironments?: string[];
}

export function SecretsEditor({ 
    orgId, 
    projectId, 
    environment = "production",
    serviceId,
    isLocal = false,
    availableEnvironments = []
}: SecretsEditorProps) {
    const {
        secrets,
        drafts,
        isLoading,
        searchTerm,
        setSearchTerm,
        addDraft,
        updateDraft,
        discardDrafts,
        sync,
        hasChanges,
        isSyncing,
        revealValue,
        deleteSecret,
        isDeleting,
        removeDraft,
        editSecret,
        copyFromEnvironment
    } = useSecrets(orgId, projectId, environment, serviceId, isLocal);

    const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
    const [isRevealing, setIsRevealing] = useState<Record<string, boolean>>({});
    const [revealedDrafts, setRevealedDrafts] = useState<Record<number, boolean>>({});

    // ZUI Mandate: Draft Safety (Internal & External Navigation)
    useEffect(() => {
        const warningText = "You have unsaved changes. Are you sure you want to leave?";

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = warningText;
                return warningText;
            }
        };

        const handleInternalNavigation = (e: MouseEvent) => {
            if (!hasChanges) return;
            
            const target = e.target as HTMLElement;
            const a = target.closest("a");
            
            if (a && a.href && !a.href.includes("#") && !a.target) {
                if (!window.confirm(warningText)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("click", handleInternalNavigation, { capture: true });
        
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("click", handleInternalNavigation, { capture: true });
        };
    }, [hasChanges]);

    const handleToggleReveal = async (id: string) => {
        if (revealedValues[id]) {
            const next = { ...revealedValues };
            delete next[id];
            setRevealedValues(next);
            return;
        }

        setIsRevealing(prev => ({ ...prev, [id]: true }));
        try {
            const val = await revealValue(id);
            setRevealedValues(prev => ({ ...prev, [id]: val }));
        } finally {
            setIsRevealing(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    <Input
                        placeholder="Search keys..."
                        className="pl-9 bg-muted/10 border-none h-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges ? (
                        <Badge variant="outline" className="h-9 px-4 border-amber-500/30 text-amber-600 bg-amber-500/10 font-black uppercase tracking-tighter animate-pulse flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Unsaved Changes
                        </Badge>
                    ) : null}
                    
                    {hasChanges && (
                        <Button variant="ghost" size="sm" onClick={discardDrafts} className="h-9 text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4 mr-2" />
                            Discard
                        </Button>
                    )}

                    <div className="flex items-center">
                        <Button
                            size="sm"
                            disabled={!hasChanges || isSyncing}
                            onClick={sync}
                            className="h-9 rounded-r-none border-r border-primary-foreground/10 shadow-lg shadow-primary/20"
                        >
                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="default" className="h-9 w-8 px-0 rounded-l-none border-l border-white/10 shadow-lg shadow-primary/20">
                                    <ChevronDown className="w-4 h-4 text-white" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-popover border-border rounded-xl shadow-2xl">
                                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground py-2">
                                    Quick Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-muted" />
                                
                                {availableEnvironments
                                    .filter(env => env !== environment)
                                    .map((env: string) => (
                                        <DropdownMenuItem 
                                            key={env} 
                                            className="text-xs font-bold py-2.5 cursor-pointer capitalize"
                                            onClick={() => copyFromEnvironment(env)}
                                        >
                                            <Copy className="w-3.5 h-3.5 mr-2 opacity-60" />
                                            Copy from {env}
                                        </DropdownMenuItem>
                                    ))
                                }

                                <DropdownMenuSeparator className="bg-muted" />
                                <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer text-primary" onClick={addDraft}>
                                    <Plus className="w-3.5 h-3.5 mr-2" />
                                    Add New Secret
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border bg-card/10 backdrop-blur-xl overflow-hidden">
                <Table className="table-fixed">
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-b-muted/20">
                            <TableHead className="w-[40%] text-[10px] uppercase font-black tracking-widest px-6 h-10">Secret Key</TableHead>
                            <TableHead className="w-[50%] text-[10px] uppercase font-black tracking-widest px-6 h-10">Value</TableHead>
                            <TableHead className="w-[10%] text-[10px] uppercase font-black tracking-widest px-6 h-10 text-right">Security</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-60" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <>
                                {secrets.map((secret) => {
                                    const draftIndex = drafts.findIndex(d => d.originalKey === secret.key);
                                    const isEditing = draftIndex !== -1;
                                    const draft = isEditing ? drafts[draftIndex] : null;

                                    if (isEditing && draft) {
                                        const keyError = validateSecretKey(draft.key);
                                        return (
                                            <TableRow key={secret.id} className="bg-primary/[0.03] border-b-primary/10 transition-colors h-14">
                                                <TableCell className="px-6 py-2">
                                                    <div className="space-y-1">
                                                        <Input
                                                            autoFocus
                                                            value={draft.key}
                                                            onChange={(e) => updateDraft(draftIndex, { key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                                                            className={`font-mono h-8 text-sm ${keyError ? 'border-destructive text-destructive' : 'border-primary/20 text-primary'}`}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-2">
                                                        <div className="relative group/val">
                                                            <Input
                                                                type={revealedDrafts[draftIndex] ? "text" : "password"}
                                                                value={draft.value}
                                                                onChange={(e) => updateDraft(draftIndex, { value: e.target.value })}
                                                                className={`font-mono h-8 text-sm ${!draft.value.trim() ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 bg-white/5'} focus-visible:ring-1 focus-visible:ring-primary/50 pr-10`}
                                                            />
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                                {!draft.value.trim() && (
                                                                    <span title="Empty value will be skipped">
                                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => setRevealedDrafts(prev => ({ ...prev, [draftIndex]: !prev[draftIndex] }))}
                                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                                >
                                                                    {revealedDrafts[draftIndex] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-3 h-8">
                                                        <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase whitespace-nowrap">
                                                            Editing
                                                        </Badge>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeDraft(draftIndex); }}
                                                            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                                            title="Cancel changes"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    return (
                                        <TableRow key={secret.id} className="group hover:bg-white/[0.02] border-b-white/[0.05] transition-colors duration-200 h-14">
                                            <TableCell className="px-6 font-mono font-bold text-sm text-primary/80 group-hover:text-primary transition-colors truncate max-w-[200px]" title={secret.key}>
                                                {secret.key}
                                            </TableCell>
                                            <TableCell className="px-6 font-mono text-sm max-w-[300px]">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className={`truncate ${revealedValues[secret.id] ? "text-foreground" : "text-muted-foreground/30"}`}>
                                                        {isRevealing[secret.id] ? "decrypting..." : (revealedValues[secret.id] || "••••••••••••••••")}
                                                    </span>
                                                    <button
                                                        onClick={() => handleToggleReveal(secret.id)}
                                                        disabled={isRevealing[secret.id]}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary"
                                                    >
                                                        {revealedValues[secret.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Shield className="w-3.5 h-3.5 text-primary/20 group-hover:text-primary/60 transition-colors" />
                                                    
                                                    <button
                                                        onClick={() => editSecret(secret)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Secret?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete <span className="font-mono font-bold text-primary">{secret.key}</span>? This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    onClick={() => deleteSecret(secret.id)}
                                                                    variant="destructive"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {drafts.filter(d => !d.originalKey).map((draft, i) => {
                                    // Adjusted index for global updateDraft call
                                    const globalIndex = drafts.indexOf(draft);
                                    const keyError = validateSecretKey(draft.key);
                                    return (
                                        <TableRow key={`new-draft-${i}`} className="bg-primary/[0.03] border-b-primary/10 transition-colors">
                                            <TableCell className="px-6 align-top py-4">
                                                <div className="space-y-1">
                                                    <Input
                                                        autoFocus
                                                        value={draft.key}
                                                        onChange={(e) => updateDraft(globalIndex, { key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                                                        placeholder="NEW_KEY"
                                                        className={`font-mono text-sm ${keyError ? 'border-destructive text-destructive' : 'border-primary/20 text-primary'}`}
                                                    />
                                                    {keyError && (
                                                        <p className="text-[10px] text-destructive flex items-center gap-1 font-bold animate-in fade-in slide-in-from-left-1 pt-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {keyError}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 align-top py-4">
                                                <div className="relative group/val">
                                                    <Input
                                                        type={revealedDrafts[globalIndex] ? "text" : "password"}
                                                        value={draft.value}
                                                        onChange={(e) => updateDraft(globalIndex, { value: e.target.value })}
                                                        placeholder="Enter value..."
                                                        className={`font-mono text-sm ${!draft.value.trim() ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 bg-white/5'} focus-visible:ring-1 focus-visible:ring-primary/50 pr-10`}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        {!draft.value.trim() && (
                                                            <span title="Empty value will be skipped">
                                                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => setRevealedDrafts(prev => ({ ...prev, [globalIndex]: !prev[globalIndex] }))}
                                                            className="text-muted-foreground hover:text-primary transition-colors"
                                                        >
                                                            {revealedDrafts[globalIndex] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 align-top py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 h-9">
                                                    <Badge className="bg-primary text-primary-foreground text-[10px] font-black uppercase animate-pulse">
                                                        Draft
                                                    </Badge>
                                                    <button
                                                        onClick={() => removeDraft(globalIndex)}
                                                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex justify-end pt-2">
                <Button variant="ghost" size="sm" onClick={addDraft} className="text-primary hover:bg-primary/10 h-9 font-bold px-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Secret
                </Button>
            </div>
        </div>
    );
}
