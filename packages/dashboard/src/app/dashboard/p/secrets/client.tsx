"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { useZmsStore } from "@/infrastructure/state/store";
import { Badge } from "@/ui/components/badge";
import { Lock, Plus, Settings2, Sparkles, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/ui/components/tabs";
import { SecretsEditor } from "@/ui/modules/vault-editor/secrets-editor";
import { useRouter } from "next/navigation";
import { ProjectHeader } from "@/ui/layouts/project-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Button } from "@/ui/components/button";
import { toast } from "sonner";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";

export function ProjectSecretsClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeOrg, activeProject, setProject } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = searchParams.get('pid') || resolveProjectId(params.projectId, activeProject?.id);

  const [activeEnv, setActiveEnv] = useState<string | null>(null);

  // 0. Fetch All Projects (needed to ensure context is valid)
  const projectsQuery = useQuery({
    queryKey: ["projects", orgId],
    queryFn: async () => {
      ZmsApiClient.setContext(orgId);
      const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>(`/orgs/${orgId}/projects`);
      return res.data;
    },
    enabled: !!orgId,
  });

  // 1. Fetch real services - Enabled only after Projects are ready
  const servicesQuery = useQuery({
    queryKey: ["services", orgId, projectId],
    queryFn: async () => {
      ZmsApiClient.setContext(orgId);
      const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/services`);
      return res.data;
    },
    enabled: !!orgId && !!projectId && projectsQuery.isSuccess,
  });
  const services = servicesQuery.data || [];

  // 2. Fetch Environments - Enabled only after Services are ready
  const environmentsQuery = useQuery({
    queryKey: ["environments", orgId, projectId],
    queryFn: async () => {
      ZmsApiClient.setContext(orgId);
      const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/environments`);
      return res.data;
    },
    enabled: !!orgId && !!projectId && servicesQuery.isSuccess,
  });
  const environments = environmentsQuery.data || [];

  const envPriority = ["development", "dev", "staging", "test", "production", "prod"];
  const sortedEnvs = [...environments].sort((a: any, b: any) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aIdx = envPriority.findIndex(p => aName.includes(p));
    const bIdx = envPriority.findIndex(p => bName.includes(p));
    if (aIdx === -1 && bIdx === -1) return aName.localeCompare(bName);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  // Set default active environment
  useEffect(() => {
    if (!activeEnv && sortedEnvs.length > 0) {
      setActiveEnv(sortedEnvs[0].name);
    }
  }, [sortedEnvs, activeEnv]);

  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset active context when project changes
  useEffect(() => {
    setActiveServiceId(null);
    setActiveEnv(null);
  }, [projectId]);

  // Set first service as active once loaded
  useEffect(() => {
    if (!activeServiceId && services.length > 0) {
      setActiveServiceId(services[0].id);
    }
  }, [services, activeServiceId]);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isServiceDialogOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isServiceDialogOpen]);

  const addServiceMutation = useMutation({
    mutationFn: async (name: string) => {
      ZmsApiClient.setContext(orgId);
      return ZmsApiClient.post<{ success: boolean; data: any }>(`/projects/${projectId}/services`, { name });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["services", orgId, projectId] });
      if (res.data?.id) {
        setActiveServiceId(res.data.id);
      }
      toast.success("Service created");
    }
  });

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (newServiceName.trim()) {
      addServiceMutation.mutate(newServiceName.toLowerCase().replace(/\s+/g, "-"));
      setIsServiceDialogOpen(false);
      setNewServiceName("");
    }
  };

  const projectName = activeProject?.name || projectId.split("-")[0];

  return (
    <div key={projectId} className="space-y-6 animate-in fade-in duration-500">
      <ProjectHeader
        title="Secrets"
        description="Manage and version application secrets with project-level isolation."
        showProject
        showService
        showEnv
        activeServiceId={activeServiceId}
        onServiceChange={setActiveServiceId}
        onAddService={() => setIsServiceDialogOpen(true)}
        activeEnv={activeEnv}
        onEnvChange={setActiveEnv}
      />

      {/* 2. Secrets Engine */}
      <div className="space-y-8">

        {/* The Hardened Secrets Engine Implementation (PBI-301) */}
        {activeServiceId && activeEnv ? (
          <div key={`${activeServiceId}-${activeEnv}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SecretsEditor
              orgId={orgId}
              projectId={projectId}
              environment={activeEnv}
              serviceId={activeServiceId}
              availableEnvironments={sortedEnvs.map((e: any) => e.name)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-[32px] border border-dashed border-border/60">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-1">No Services Found</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-[240px] text-center">
              Each project needs at least one service to manage its secrets.
            </p>
            <Button 
                onClick={() => setIsServiceDialogOpen(true)}
                className="font-black uppercase tracking-widest text-[10px] h-10 px-6"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Create First Service
            </Button>
          </div>
        )}
      </div>

      {/* 3. Footer / Help Section */}
      <div className="pt-10 border-t border-border">
        <div className="bg-muted/50 rounded-3xl p-8 border border-border flex items-center justify-between">
          <div className="space-y-2">
            <h4 className="font-black text-sm uppercase tracking-widest text-primary/80">Need Help?</h4>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Secrets are injected into your environment at runtime via the ZMS CLI.
              Use <code className="bg-muted px-1.5 py-0.5 rounded text-primary">zms run</code> to access these values.
            </p>
          </div>
          <button className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border-b border-transparent hover:border-primary">
            Read Injection Docs →
          </button>
        </div>
      </div>

      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tighter">Create New Service</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Define a new service scope for your secrets in <span className="text-primary font-bold">{projectName}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddService} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-70">
                Service Name
              </label>
              <Input
                ref={inputRef}
                placeholder="e.g. database, api-gateway"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="bg-muted/50 border-border h-11 font-bold tracking-tight focus:ring-primary/50"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={!newServiceName.trim() || addServiceMutation.isPending}
                className="w-full font-black uppercase tracking-widest text-[11px] h-11 shadow-lg shadow-primary/20"
              >
                {addServiceMutation.isPending ? "Creating..." : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
