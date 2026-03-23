"use client";

import { useZmsStore } from "@/infrastructure/state/store";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { ProjectHeader } from "@/ui/layouts/project-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
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

export default function ProjectSettingsPage() {
  const { activeOrg, activeProject, setProject } = useZmsStore();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(activeProject?.name || "");

  // Fetch fresh project details
  const { data: projectResponse, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!orgId || !projectId) return null;
      ZmsApiClient.setContext(orgId);
      const res: any = await ZmsApiClient.get(`/orgs/${orgId}/projects/${projectId}`);
      if (res.data) {
        setName(res.data.name);
        setProject(res.data);
      }
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newName: string) => {
      ZmsApiClient.setContext(orgId);
      const res: any = await ZmsApiClient.patch(`/orgs/${orgId}/projects/${projectId}`, { name: newName });
      return res.data;
    },
    onSuccess: (updatedProject) => {
      setProject(updatedProject);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Project updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update project");
    }
  });

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      ZmsApiClient.setContext(orgId);
      await ZmsApiClient.delete(`/orgs/${orgId}/projects/${projectId}`);
      
      toast.success("Project deleted successfully");
      
      // Clear active project and redirect
      setProject(null as any);
      router.push(`/dashboard/${orgId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
      setIsDeleting(false); // Only reset if failed, otherwise redirecting anyway
    }
  };

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
        title="Project Settings"
        description="Configure project-level metadata, security policies, and lifecycle settings."
      />
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">General Settings</h3>
          <div className="grid gap-6 p-6 rounded-xl border bg-card">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Project Name" 
              />
            </div>
            <Button 
              size="sm" 
              className="w-fit" 
              onClick={() => updateMutation.mutate(name)}
              disabled={updateMutation.isPending || !name || name === activeProject?.name}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Danger Zone</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Deleting this project will permanently remove all associated secrets, history, and rotation policies. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  project <strong>{activeProject?.name}</strong> and all its associated secrets, 
                  environments, and services.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  variant="destructive" 
                  onClick={handleDeleteProject}
                >
                  Continue to Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}
