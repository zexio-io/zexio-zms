"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { Plus, Key, Clock, Trash2, ShieldCheck, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { CreateTokenModal } from "./m2m-create-token-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
import { useZmsStore } from "@/infrastructure/state/store";

export function ServiceTokenList({ serviceId }: { serviceId?: string }) {
  const params = useParams();
  const { activeOrg, activeProject } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Use query params to filter by projectId or serviceId
  const queryKey = serviceId ? ["service_tokens", serviceId] : ["service_tokens", projectId];
  const queryUrl = serviceId
    ? `/service-tokens?serviceId=${serviceId}`
    : `/service-tokens?projectId=${projectId}`;

  const { data: tokens, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => ZmsApiClient.get<{ success: boolean; data: any[] }>(queryUrl),
    enabled: !!projectId && projectId !== "default",
  });

  const handleRevoke = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token? It will stop working immediately.")) return;

    try {
      await ZmsApiClient.delete(`/service-tokens/${tokenId}`, {
        headers: { 'x-zms-organization-id': orgId }
      });
      toast.success("Token revoked successfully");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to revoke token");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <CreateTokenModal onSuccess={() => refetch()}>
          <Button
            variant="outline"
            className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Token
          </Button>
        </CreateTokenModal>
      </div>

      {(tokens?.data.length === 0) ? (
        <Card className="border-dashed bg-muted/20 border-2 rounded-3xl py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
              <Key className="w-8 h-8 text-primary/40" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">No Service Tokens yet</h4>
              <p className="text-sm text-muted-foreground">Create a token to start syncing secrets to your machines.</p>
            </div>
            <CreateTokenModal onSuccess={() => refetch()}>
              <Button variant="outline" className="rounded-xl">
                Get Started
              </Button>
            </CreateTokenModal>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tokens?.data.map((token: any) => (
            <div
              key={token.id}
              className="group relative flex items-center justify-between p-5 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{token.name}</span>
                    <div className="flex gap-1.5 items-center">
                      {!serviceId && token.service && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 font-black text-primary uppercase opacity-80">
                          {token.service.name}
                        </span>
                      )}
                      {token.environment && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-black text-muted-foreground uppercase opacity-60">
                          {token.environment.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Key className="w-3 h-3" /> zms_st_...{token.lastFour}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last used: {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg hover:text-destructive transition-colors"
                  onClick={() => handleRevoke(token.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
