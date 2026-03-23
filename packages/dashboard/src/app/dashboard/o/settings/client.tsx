"use client";

import { useZmsStore } from "@/infrastructure/state/store";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { toast } from "sonner";
import { useState } from "react";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Loader2, Lock, ShieldCheck, Sparkles, Fingerprint } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveOrgId } from "@/infrastructure/utils/utils";
import { Badge } from "@/ui/components/badge";
import { ProjectHeader } from "@/ui/layouts/project-header";

export function WorkspaceSettingsClient() {
  const { activeOrg, setOrg } = useZmsStore();
  const queryClient = useQueryClient();
  const orgId = resolveOrgId(undefined, activeOrg?.id);
  const [name, setName] = useState(activeOrg?.name || "");

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      const res: any = await ZmsApiClient.get(`/orgs/${orgId}`);
      if (res.data) {
        setName(res.data.name);
      }
      return res.data;
    },
    enabled: !!orgId && orgId !== "primary",
  });

  const updateMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res: any = await ZmsApiClient.patch(`/orgs/${orgId}`, { name: newName });
      return res.data;
    },
    onSuccess: (updatedOrg) => {
      setOrg(updatedOrg);
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      toast.success("Workspace updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update workspace");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <ProjectHeader
        title="Workspace Settings"
        description="Configure organization-level identity and global security protocols."
      />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">General Configuration</h3>
          <div className="grid gap-6 p-6 rounded-xl border bg-card">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Organization name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace ID</label>
                <Input
                  value={orgId}
                  readOnly
                  className="bg-muted/10 cursor-not-allowed font-mono text-xs"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-fit"
              onClick={() => updateMutation.mutate(name)}
              disabled={updateMutation.isPending || !name || name === activeOrg?.name}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Security & Architecture</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Enterprise Card */}
            <div className="p-6 rounded-xl border bg-card space-y-4 relative overflow-hidden group">
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge variant="outline" className="text-[9px] font-black border-primary/20 bg-primary/5 text-primary">ENTERPRISE</Badge>
              </div>
              <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-sm">E2EE Secret Delivery</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  End-to-End Encrypted delivery of secrets directly to your SDK. Bypasses TLS termination for absolute zero-trust.
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs font-bold text-primary tracking-tight opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => window.open('https://zexio.io/enterprise', '_blank')}
              >
                Talk to Engineering <Sparkles className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Placeholder for future CE E2EE settings */}
            <div className="p-6 rounded-xl border border-dashed border-muted/20 flex flex-col items-center justify-center text-center bg-muted/5">
              <ShieldCheck className="w-8 h-8 text-muted-foreground opacity-20 mb-3" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">E2EE Destination Protocols</p>
              <p className="text-[10px] text-muted-foreground/60 italic">Managed by Secret Destination policies</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
