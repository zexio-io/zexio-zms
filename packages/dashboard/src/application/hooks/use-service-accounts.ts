"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { ServiceAccount, ServiceAccountDraft } from "@/domain/entities/service-account";
import { toast } from "sonner";

export function useServiceAccounts(orgId: string) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["service-accounts", orgId],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: ServiceAccount[] }>(
        `/service-accounts?org=${orgId}`
      );
      return res.data;
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (draft: ServiceAccountDraft) => 
      ZmsApiClient.post("/service-accounts", { orgId, ...draft }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-accounts", orgId] });
      toast.success("Service Account created successfully");
    },
    onError: () => {
      toast.error("Failed to create Service Account");
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => 
      ZmsApiClient.delete(`/service-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-accounts", orgId] });
      toast.success("Service Account revoked");
    },
    onError: () => {
      toast.error("Failed to revoke Service Account");
    }
  });

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  return {
    accounts: filteredAccounts,
    isLoading,
    searchTerm,
    setSearchTerm,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    revoke: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
    hasAccounts: accounts && accounts.length > 0,
  };
}
