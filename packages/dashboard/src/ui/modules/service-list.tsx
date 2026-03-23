"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { Plus, Zap, Trash2, ShieldCheck, Key, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
import { useZmsStore } from "@/infrastructure/state/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

export function ServiceList() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [editingService, setEditingService] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [isDeleting, setIsDeleting] = useState<any>(null);

  const { activeOrg, activeProject } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);

  const { data: services, isLoading } = useQuery({
    queryKey: ["project_services", projectId],
    queryFn: () => ZmsApiClient.get<{ success: boolean; data: any[] }>(`/orgs/${orgId}/projects/${projectId}/services`),
    enabled: !!orgId && orgId !== "primary" && !!projectId && projectId !== "default",
  });

  const createServiceMutation = useMutation({
    mutationFn: (name: string) => ZmsApiClient.post(`/orgs/${orgId}/projects/${projectId}/services`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_services", projectId] });
      setIsCreating(false);
      setNewServiceName("");
      toast.success("Service created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create service");
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      ZmsApiClient.patch<{ success: boolean; data: any }>(`/orgs/${orgId}/projects/${projectId}/services/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_services", projectId] });
      toast.success("Service renamed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to rename service");
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) =>
      ZmsApiClient.delete<{ success: boolean }>(`/orgs/${orgId}/projects/${projectId}/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_services", projectId] });
      toast.success("Service deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete service");
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button
              className="rounded-xl bg-primary text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-primary/10 rounded-[32px]">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Zap className="w-6 h-6 fill-primary/20" />
              </div>
              <DialogTitle className="text-2xl font-black">Add New Service</DialogTitle>
              <DialogDescription>
                Create a new service entry to manage its environment-specific tokens.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-6 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (newServiceName) createServiceMutation.mutate(newServiceName);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-60">Service Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. auth-api, billing-worker"
                  className="rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-2xl h-12 font-black shadow-lg shadow-primary/20"
                disabled={createServiceMutation.isPending || !newServiceName}
              >
                {createServiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Service
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-primary/10 rounded-[32px]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Zap className="w-6 h-6 fill-primary/20" />
            </div>
            <DialogTitle className="text-2xl font-black">Rename Service</DialogTitle>
            <DialogDescription>
              Change the name of your service. This won't affect existing tokens.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (editName) {
                updateServiceMutation.mutate({ id: editingService.id, name: editName }, {
                  onSuccess: () => setEditingService(null)
                });
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider opacity-60">New Name</Label>
              <Input
                id="edit-name"
                className="rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-2xl h-12 font-black shadow-lg shadow-primary/20"
              disabled={updateServiceMutation.isPending || !editName}
            >
              {updateServiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!isDeleting} onOpenChange={(open) => !open && setIsDeleting(null)}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-destructive/10 rounded-[32px]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
              <Trash2 className="w-6 h-6 fill-destructive/20" />
            </div>
            <DialogTitle className="text-2xl font-black">Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">"{isDeleting?.name}"</span>? This action is permanent and will invalidate all tokens.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-4">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl h-12 font-bold"
              onClick={() => setIsDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-2xl h-12 font-black shadow-lg shadow-destructive/20"
              disabled={deleteServiceMutation.isPending}
              onClick={() => {
                deleteServiceMutation.mutate(isDeleting.id, {
                  onSuccess: () => setIsDeleting(null)
                });
              }}
            >
              {deleteServiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {(services?.data.length === 0) ? (
        <Card className="border-dashed bg-muted/20 border-2 rounded-[2rem] py-16">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center">
              <Zap className="w-10 h-10 text-primary/20" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xl">No Services yet</h4>
              <p className="text-sm text-muted-foreground max-w-xs">Define your applications here to start managing their machine identities.</p>
            </div>
            <Button variant="outline" className="rounded-xl mt-4" onClick={() => setIsCreating(true)}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.data.map((service: any) => (
            <Card
              key={service.id}
              className="group relative border bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all duration-500"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                      onClick={() => {
                        setEditingService(service);
                        setEditName(service.name);
                      }}
                    >
                      <Plus className="w-4 h-4 rotate-45" /> {/* Use Plus rotated for "Edit" or just generic icon if Edit not found */}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      onClick={() => setIsDeleting(service)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-black italic uppercase tracking-tighter">{service.name}</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Managed Identity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-medium border-b border-border/50 pb-2">
                    <span className="text-muted-foreground uppercase tracking-widest">Added</span>
                    <span>{new Date(service.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground uppercase tracking-widest">Active Tokens</span>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 border-2 border-background flex items-center justify-center text-[8px] font-black text-green-500">D</div>
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-background flex items-center justify-center text-[8px] font-black text-blue-500">S</div>
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 border-2 border-background flex items-center justify-center text-[8px] font-black text-purple-500">P</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-6">
                <Button variant="outline" className="w-full rounded-xl gap-2 text-xs font-bold group/btn" asChild>
                  <a href={`/dashboard/${orgId}/p/${projectId}/services/${service.id}`}>
                    Manage Tokens
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
