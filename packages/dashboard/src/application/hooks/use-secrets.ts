"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Secret, SecretDraft } from "@/domain/entities/secret";
import { toast } from "sonner";

export function useSecrets(
  orgId: string, 
  projectId?: string, 
  environment: string = "production",
  serviceId?: string,
  isLocal: boolean = false
) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<SecretDraft[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Local Browser Context Key
  const localKey = `zms-local-secrets:${projectId}:${serviceId}:${environment}`;

  const scopeKey = projectId ? `project:${projectId}` : `org:${orgId}`;
  
  const { data: secrets, isLoading, refetch } = useQuery({
    queryKey: ["secrets", scopeKey, environment, serviceId, isLocal],
    queryFn: async () => {
      if (isLocal) {
        // ... (keep local logic for testing/prototype)
        await new Promise(r => setTimeout(r, 100));
        const stored = localStorage.getItem(localKey);
        const data = stored ? JSON.parse(stored) : {};
        
        return Object.entries(data).map(([key, value]) => ({
          id: key,
          key,
          value: value as string,
          isSensitive: true
        }));
      }

      ZmsApiClient.setContext(orgId, environment, serviceId);
      const res = await ZmsApiClient.get<{ success: boolean; data: Record<string, string> }>(`/projects/${projectId}/services/${serviceId}/secrets`);
      
      return Object.entries(res.data).map(([key, value]) => ({
        id: key,
        key,
        value: "••••••••••••••••", // Initial masked value for secrets
        isSensitive: true
      }));
    },
    enabled: !!orgId && orgId !== "primary" && !!serviceId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (batch: SecretDraft[]) => {
      if (isLocal) {
        // ...
        await new Promise(r => setTimeout(r, 600)); 
        const stored = localStorage.getItem(localKey);
        const data = stored ? JSON.parse(stored) : {};
        batch.forEach(d => { if (d.key) data[d.key] = d.value; });
        localStorage.setItem(localKey, JSON.stringify(data));
        return { success: true };
      }

      ZmsApiClient.setContext(orgId, environment, serviceId);
      
      // Filter out empty drafts (Safety First)
      const validBatch = batch.filter(d => d.key.trim() !== "" && d.value.trim() !== "");
      
      if (validBatch.length === 0) {
        toast.error("No valid secrets to save (Key and Value are required)");
        return { success: false, aborted: true };
      }

      // Handle Renames...
      for (const d of validBatch) {
          if (d.originalKey && d.originalKey !== d.key) {
              await ZmsApiClient.delete(`/projects/${projectId}/services/${serviceId}/secrets/${encodeURIComponent(d.originalKey)}`);
          }
      }

      return ZmsApiClient.post<{ success: boolean; message: string }>(`/projects/${projectId}/services/${serviceId}/secrets/batch`, { 
        secrets: validBatch.map(d => ({ key: d.key, value: d.value, isSensitive: d.isSensitive }))
      });
    },
    onSuccess: (res: any) => {
      // Don't show success toast if we aborted early
      if (res?.aborted) return;
      
      queryClient.invalidateQueries({ queryKey: ["secrets", scopeKey, environment, serviceId, isLocal] });
      setDrafts([]);
      toast.success(isLocal ? "Local Secrets Updated" : "Secrets synced successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to sync secrets");
    }
  });

  const revealMutation = useMutation({
    mutationFn: async (secretId: string) => {
        if (isLocal) {
           const stored = localStorage.getItem(localKey);
           const data = stored ? JSON.parse(stored) : {};
           return data[secretId] || "not found";
        }
        ZmsApiClient.setContext(orgId, environment, serviceId);
        const res = await ZmsApiClient.get<{ success: boolean; data: { content: string } }>(`/projects/${projectId}/services/${serviceId}/secrets/${encodeURIComponent(secretId)}`);
        return res.data.content;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (secretId: string) => {
      if (isLocal) {
        const stored = localStorage.getItem(localKey);
        const data = stored ? JSON.parse(stored) : {};
        delete data[secretId];
        localStorage.setItem(localKey, JSON.stringify(data));
        return { success: true };
      }
      
      ZmsApiClient.setContext(orgId, environment, serviceId);
      return ZmsApiClient.delete(`/projects/${projectId}/services/${serviceId}/secrets/${encodeURIComponent(secretId)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets", scopeKey, environment, serviceId, isLocal] });
      toast.success(isLocal ? "Secret Removed (Local)" : "Secret deleted");
      refetch();
    }
  });

  const filteredSecrets = useMemo(() => {
    if (!secrets) return [];
    return secrets.filter(s => 
      s.key?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [secrets, searchTerm]);

  const addDraft = () => {
    setDrafts(prev => [...prev, { key: "", value: "", isSensitive: true, isNew: true }]);
  };

  const editSecret = async (secret: Secret) => {
      // Reveal the value first so we can edit it
      ZmsApiClient.setContext(orgId, environment, serviceId);
      const res = await ZmsApiClient.get<{ success: boolean; data: { content: string } }>(`/projects/${projectId}/services/${serviceId}/secrets/${encodeURIComponent(secret.key)}`);
      
      setDrafts(prev => [
          ...prev, 
          { 
              key: secret.key, 
              value: res.data.content, 
              isSensitive: secret.isSensitive, 
              originalKey: secret.key 
          }
      ]);
  };

  const copyFromEnvironment = async (sourceEnv: string) => {
    ZmsApiClient.setContext(orgId, sourceEnv, serviceId);
    const res = await ZmsApiClient.get<{ success: boolean; data: Record<string, string> }>(`/projects/${projectId}/services/${serviceId}/secrets`);
    
    if (res.data) {
        const newDrafts: SecretDraft[] = Object.entries(res.data).map(([key, value]) => ({
            key,
            value,
            isSensitive: true,
            isNew: true
        }));
        
        setDrafts(prev => [...prev, ...newDrafts]);
        toast.success(`Imported ${newDrafts.length} secrets from ${sourceEnv}`);
    }
  };

  const updateDraft = (index: number, patch: Partial<SecretDraft>) => {
    setDrafts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const removeDraft = (index: number) => {
    setDrafts(prev => prev.filter((_, i) => i !== index));
    toast.info("Draft removed");
  };

  const discardDrafts = () => {
    setDrafts([]);
    toast.info("Changes discarded");
  };

  const hasChanges = drafts.length > 0;

  return {
    secrets: filteredSecrets,
    drafts,
    isLoading,
    searchTerm,
    setSearchTerm,
    addDraft,
    updateDraft,
    removeDraft,
    discardDrafts,
    hasChanges,
    revealValue: revealMutation.mutateAsync,
    isRevealing: revealMutation.isPending,
    deleteSecret: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    sync: () => upsertMutation.mutate(drafts),
    isSyncing: upsertMutation.isPending,
    editSecret,
    copyFromEnvironment,
  };
}
