"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Project } from "@/domain/entities/project";

export function useProjects(orgId: string) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: async () => {
      const res = await ZmsApiClient.get<{ success: boolean; data: Project[] }>(
        `/orgs/${orgId}/projects`
      );
      return res.data;
    },
    enabled: !!orgId && orgId !== "primary",
  });

  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; services?: string[] }) => {
      return await ZmsApiClient.post<{ success: boolean; data: Project }>(
        `/orgs/${orgId}/projects`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
    },
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  return {
    projects: filteredProjects,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    isEmpty: projects?.length === 0,
    hasResults: filteredProjects.length > 0,
    createProjectMutation,
  };
}
