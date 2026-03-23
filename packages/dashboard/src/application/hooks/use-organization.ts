"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Organization } from "@/domain/entities/organization";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useZmsStore } from "@/infrastructure/state/store";

export function useOrganization(orgId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { setOrg } = useZmsStore();

  const { data: organization, isLoading, error } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      try {
        const res = await ZmsApiClient.get<{ success: boolean; data: Organization }>(`/orgs/${orgId}`);
        return res.data;
      } catch (e: any) {
        if (e.message.includes("404")) {
          toast.error("Organization not found. Redirecting...");
          // Clear stale state to allow re-selection
          (useZmsStore.getState() as any).setOrg(null);
          router.replace("/dashboard");
        }
        throw e;
      }
    },
    enabled: !!orgId && orgId !== "primary",
    retry: false
  });

  const updateOrganization = useMutation({
    mutationFn: (data: Partial<Organization>) => 
      ZmsApiClient.patch(`/orgs/${orgId}`, data),
    onSuccess: (updatedOrg: any) => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      toast.success("Workspace settings updated");
    },
  });

  return {
    organization,
    isLoading,
    updateOrganization: updateOrganization.mutate,
    isUpdating: updateOrganization.isPending,
  };
}
