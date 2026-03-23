"use client";

import { useParams } from "next/navigation";
import { Layers, Plus, Shield, Zap, Activity, Clock, MoreHorizontal, Settings2, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Button } from "@/ui/components/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Skeleton } from "@/ui/components/skeleton";
import { ProjectHeader } from "@/ui/layouts/project-header";
import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter,
  SheetClose
} from "@/ui/components/sheet";
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
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { toast } from "sonner";

import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
import { useZmsStore } from "@/infrastructure/state/store";

export default function ProjectEnvironmentsPage() {
  const params = useParams();
  const { activeOrg, activeProject } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);

  /*
- [x] Implement Environment Management CRUD
- [/] Implement Reactive Secret Editor
    - [ ] Update `ZmsApiClient` for `serviceId` support
    - [ ] Update `useVault` hook for dual-scoping (Env & Service)
    - [ ] Fetch services and environments in `SecretsPage`
    - [ ] Implement UI selectors in `SecretsPage`
    - [ ] Enhance `VaultEditor` with dual-scope context
- [ ] Verification
    - [ ] Manual test: switch service/env and verify secrets
*/
  const { data: environments, isLoading, refetch } = useQuery({
    queryKey: ["environments", projectId],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>(
        `/projects/${projectId}/environments`
      );
      return res.data;
    },
    enabled: !!projectId && projectId !== "default",
  });

  const envPriority = ["development", "dev", "staging", "test", "production", "prod"];
  const sortedEnvs = [...(environments || [])].sort((a: any, b: any) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aIdx = envPriority.findIndex(p => aName.includes(p));
    const bIdx = envPriority.findIndex(p => bName.includes(p));
    
    if (aIdx === -1 && bIdx === -1) return aName.localeCompare(bName);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");

  const { mutate: createEnv, isPending } = useMutation({
    mutationFn: async (name: string) => {
      return await ZmsApiClient.post(
        `/projects/${projectId}/environments`,
        { name }
      );
    },
    onSuccess: () => {
      setIsOpen(false);
      setNewEnvName("");
      toast.success("Environment created successfully");
      refetch();
    },
  });

  const { mutate: deleteEnv, isPending: isDeleting } = useMutation({
    mutationFn: async (envId: string) => {
      return await ZmsApiClient.delete(
        `/projects/${projectId}/environments/${envId}`
      );
    },
    onSuccess: () => {
      toast.success("Environment deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete environment");
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEnvName.length > 1) {
      createEnv(newEnvName);
    }
  };

  return (
    <div className="space-y-6">
      <ProjectHeader 
        title="Environments"
        description="Manage your deployment stages and isolate secret values across environments."
      />

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Layers className="w-4 h-4 text-muted-foreground/50" />
           <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Stages</span>
        </div>
        <Button 
          disabled={isPending}
          onClick={() => setIsOpen(true)}
          size="sm"
          className="gap-2 rounded-xl h-9 px-4 transition-all shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Environment
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="bg-[#09090b] border-white/5">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-black">Create Environment</SheetTitle>
            <SheetDescription>
              Add a new deployment stage to isolate your secrets and configurations.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest opacity-50">Environment Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. testing, uat, sandbox" 
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20"
                autoFocus
              />
            </div>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-primary/70 leading-relaxed font-medium">
              Note: This environment will inherit default security shards from the project but will maintain isolated secret values.
            </div>

            <SheetFooter className="mt-8 gap-3">
              <SheetClose asChild>
                <Button type="button" variant="ghost" className="rounded-xl h-11">Cancel</Button>
              </SheetClose>
              <Button 
                type="submit" 
                disabled={isPending || newEnvName.length < 2}
                className="rounded-xl h-11 px-8 gap-2 bg-primary shadow-lg shadow-primary/20"
              >
                {isPending && <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
                Create Stage
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Environments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-dashed backdrop-blur-sm bg-card/30">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
            </Card>
          ))
        ) : sortedEnvs && sortedEnvs.length > 0 ? (
          sortedEnvs.map((env: any) => (
            <Card key={env.id} className="group hover:border-primary/40 transition-all bg-card/40 backdrop-blur-sm border-white/5 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                    env.name === 'production' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    env.name === 'staging' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                    'bg-primary/10 border-primary/20 text-primary'
                  }`}>
                    {env.name === 'production' ? <Shield className="w-6 h-6" /> :
                     env.name === 'staging' ? <Activity className="w-6 h-6" /> : 
                     <Zap className="w-6 h-6" />}
                  </div>
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-widest ${
                    env.name === 'production' ? 'border-red-500/30 text-red-500' : 'border-primary/30 text-primary'
                  }`}>
                    {env.name === 'production' ? 'Production' : 'Non-Prod'}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold capitalize">{env.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                  Target for {env.name} secrets and keys
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-2">
                       <Clock className="w-3.5 h-3.5" />
                       Created
                    </span>
                    <span className="font-mono text-muted-foreground">
                       {new Date(env.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-white/5 py-4 px-6 flex justify-between items-center border-t border-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#09090b] border-white/5">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Environment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the <span className="text-white font-bold">{env.name}</span> environment and all its associated secret values. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteEnv(env.id)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                          Delete Environment
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 font-bold hover:bg-white/10">
                    Manage Secrets
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-50 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Layers className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold">No Environments Found</h3>
              <p className="text-sm text-muted-foreground">Get started by creating your first deployment environment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
