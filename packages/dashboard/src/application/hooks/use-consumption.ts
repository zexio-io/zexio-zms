"use client";

import { useQuery } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { OrganizationConsumption } from "@/domain/entities/consumption";

export function useConsumption(orgId: string) {
  const { data: consumption, isLoading, error } = useQuery({
    queryKey: ["consumption", orgId],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: OrganizationConsumption }>(
        `/billing/consumption?org=${orgId}`
      );
      return res.data;
    },
    enabled: !!orgId,
  });

  return {
    consumption,
    isLoading,
    error,
    isNearingLimit: consumption?.metrics.some(m => m.status !== "normal"),
  };
}
