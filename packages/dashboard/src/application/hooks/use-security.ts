"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { RotationPolicy, AuditLog } from "@/domain/entities/security";
import { toast } from "sonner";

export function useSecurity(orgId: string, projectId?: string) {
  const queryClient = useQueryClient();
  const [auditAction, setAuditAction] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [auditAction]);

  const scopeKey = projectId ? `project:${projectId}` : `org:${orgId}`;

  // 1. Audit Logs (Paginated & Filterable)
  const { data: auditData, isLoading: isLogsLoading } = useQuery({
    queryKey: ["audit-logs", scopeKey, page, auditAction],
    queryFn: async () => {
      const baseUrl = projectId 
        ? `/projects/${projectId}/audit-logs`
        : `/orgs/${orgId}/audit-logs`;
      
      let url = `${baseUrl}?page=${page}&limit=${limit}`;
      
      if (auditAction && auditAction !== "all") url += `&action=${encodeURIComponent(auditAction)}`;
      
      const res = await ZmsApiClient.get<{ success: boolean; data: AuditLog[]; metadata: any }>(url);
      return res;
    },
    enabled: (!!orgId && orgId !== "primary") || !!projectId,
    refetchInterval: 30000,
  });

  // 2. Rotation Policies (Scope-Aware)
  const { data: rotationPolicies, isLoading: isRotationLoading } = useQuery({
    queryKey: ["rotation-policies", scopeKey],
    queryFn: async () => {
      const url = projectId 
        ? `/rotation-policies?projectId=${projectId}`
        : `/rotation-policies?org=${orgId}`;
      
      const res = await ZmsApiClient.get<{ success: boolean; data: RotationPolicy[] }>(url);
      return res.data;
    },
    enabled: (!!orgId && orgId !== "primary") || !!projectId,
  });

  const triggerRotation = useMutation({
    mutationFn: (policyId: string) => 
      ZmsApiClient.post(`/rotation-policies/${policyId}/rotate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotation-policies", scopeKey] });
      toast.success("Rotation triggered successfully");
    },
    onError: () => {
      toast.error("Manual rotation failed");
    }
  });

  // Server-side filtering now, but we keep this for typing consistency if needed
  const logs = auditData?.data || [];
  const metadata = auditData?.metadata || { total: 0, totalPages: 0, page: 1 };

  return {
    auditLogs: logs,
    auditMetadata: metadata,
    isLogsLoading,
    auditAction,
    setAuditAction,
    page,
    setPage,
    rotationPolicies: rotationPolicies || [],
    isRotationLoading,
    triggerRotation: triggerRotation.mutate,
    isRotating: triggerRotation.isPending,
  };
}
