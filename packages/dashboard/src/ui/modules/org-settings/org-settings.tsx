"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/application/hooks/use-organization";
import { useUIStore } from "@/infrastructure/state/store";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Skeleton } from "@/ui/components/skeleton";
import { 
    Layout, 
    AtSign, 
    Palette, 
    ShieldCheck, 
    Save, 
    AlertTriangle,
    ChevronRight,
    Building2
} from "lucide-react";

export function OrgSettings({ orgId }: { orgId: string }) {
    const { organization, isLoading, updateOrganization, isUpdating } = useOrganization(orgId);
    const { uiMode } = useUIStore();
    const [name, setName] = useState("");

    useEffect(() => {
        if (organization) {
            setName(organization.name);
        }
    }, [organization]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-64 rounded-[2.5rem]" />
                <Skeleton className="h-48 rounded-[2.5rem]" />
            </div>
        );
    }

    const hasChanges = organization && (name !== organization.name);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Identity Card */}
            <div className="p-8 rounded-2xl border bg-card shadow-sm">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                            {name[0] || 'Z'}
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-lg font-bold">Workspace Identity</h3>
                            <p className="text-xs text-muted-foreground font-medium">General identification and workspace parameters.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-1 gap-6 pt-2">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase text-muted-foreground">Workspace Name</label>
                            <Input 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="h-11 rounded-xl border-input bg-background font-medium"
                                placeholder="E.g. Zexio Global Operations"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex items-center justify-between border-t mt-2">
                        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                            Created {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}
                        </div>

                        <Button 
                            disabled={!hasChanges || isUpdating}
                            onClick={() => updateOrganization({ name })}
                            className="h-11 rounded-xl px-8 font-bold"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="p-8 rounded-2xl border border-red-500/10 bg-red-500/[0.01] space-y-6">
                <div className="flex items-center gap-2 text-red-500/80">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="text-[11px] font-bold uppercase tracking-widest">Danger Zone</h4>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-sm font-bold">Terminate Workspace</p>
                        <p className="text-xs text-muted-foreground max-w-md font-medium text-balance">
                            Permanently delete this workspace and all associated secrets. This action is irreversible.
                        </p>
                    </div>
                    <Button variant="destructive" className="h-11 rounded-xl px-8 font-bold">
                        Delete Workspace
                    </Button>
                </div>
            </div>
        </div>
    );
}
