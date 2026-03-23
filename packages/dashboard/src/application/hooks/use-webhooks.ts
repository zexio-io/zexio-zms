"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Webhook } from "@/domain/entities/webhook";
import { toast } from "sonner";

export function useWebhooks(orgId: string) {
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks", orgId],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: Webhook[] }>(`/orgs/${orgId}/webhooks`);
      return res.data;
    },
  });

  const createWebhook = useMutation({
    mutationFn: (data: Partial<Webhook>) => 
      ZmsApiClient.post(`/orgs/${orgId}/webhooks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", orgId] });
      toast.success("Webhook created successfully");
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: (webhookId: string) => 
      ZmsApiClient.delete(`/orgs/${orgId}/webhooks/${webhookId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", orgId] });
      toast.success("Webhook deleted");
    },
  });

  return {
    webhooks: webhooks || [],
    isLoading,
    createWebhook: createWebhook.mutate,
    isCreating: createWebhook.isPending,
    deleteWebhook: deleteWebhook.mutate,
  };
}
