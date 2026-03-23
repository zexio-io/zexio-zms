"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { ServiceToken, TokenScope } from "@/domain/entities/token";
import { toast } from "sonner";

export function useTokens(orgId: string, projectId: string) {
  const queryClient = useQueryClient();

  const { data: tokens, isLoading } = useQuery({
    queryKey: ["service-tokens", projectId],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: ServiceToken[] }>(`/orgs/${orgId}/projects/${projectId}/tokens`);
      return res.data;
    },
  });

  const createToken = useMutation({
    mutationFn: (data: { name: string; scope: TokenScope; expiresAt?: string }) => 
      ZmsApiClient.post(`/orgs/${orgId}/projects/${projectId}/tokens`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tokens", projectId] });
      toast.success("Service token generated");
    },
  });

  const revokeToken = useMutation({
    mutationFn: (tokenId: string) => 
      ZmsApiClient.delete(`/orgs/${orgId}/projects/${projectId}/tokens/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tokens", projectId] });
      toast.success("Service token revoked");
    },
  });

  return {
    tokens: tokens || [],
    isLoading,
    createToken: createToken.mutateAsync, // Use async for manual UI handling of result
    isCreating: createToken.isPending,
    revokeToken: revokeToken.mutate,
  };
}
