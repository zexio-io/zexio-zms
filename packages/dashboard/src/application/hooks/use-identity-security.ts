"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { UserSecurityStatus, PersonalAuditLog } from "@/domain/entities/identity";
import { toast } from "sonner";

export function useIdentitySecurity() {
  const queryClient = useQueryClient();

  const { data: securityStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ["user-security-status"],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: UserSecurityStatus }>("/user/security-status");
      return res.data;
    },
  });

  const { data: personalLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ["user-personal-logs"],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: PersonalAuditLog[] }>("/user/security-logs");
      return res.data;
    },
  });

  const revokeSession = useMutation({
    mutationFn: (sessionId: string) => 
      ZmsApiClient.delete(`/user/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-security-status"] });
      toast.success("Session revoked successfully");
    },
    onError: () => {
      toast.error("Failed to revoke session");
    }
  });

  const toggleMfa = useMutation({
    mutationFn: (enabled: boolean) => 
      ZmsApiClient.post("/user/mfa/toggle", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-security-status"] });
      toast.success("MFA settings updated");
    },
  });

  return {
    securityStatus,
    isStatusLoading,
    personalLogs: personalLogs || [],
    isLogsLoading,
    revokeSession: revokeSession.mutate,
    isRevoking: revokeSession.isPending,
    toggleMfa: toggleMfa.mutate,
    isTogglingMfa: toggleMfa.isPending,
  };
}
