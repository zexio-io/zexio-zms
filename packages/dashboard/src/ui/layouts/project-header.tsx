"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { useZmsStore } from "@/infrastructure/state/store";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/ui/components/select";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

interface ProjectHeaderProps {
  title?: string;
  description?: string;
  activeServiceId?: string | null;
  onServiceChange?: (id: string) => void;
  onAddService?: () => void;
  activeEnv?: string | null;
  onEnvChange?: (env: string) => void;
  showService?: boolean;
  showEnv?: boolean;
  showProject?: boolean;
}

export function ProjectHeader({
  title,
  description,
  activeServiceId,
  onServiceChange,
  onAddService,
  activeEnv,
  onEnvChange,
  showService = false,
  showEnv = false,
  showProject = false,
}: ProjectHeaderProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeOrg, activeProject, setProject } = useZmsStore();
  
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = searchParams.get('pid') || resolveProjectId(params.projectId, activeProject?.id);

  // 1. Fetch All Projects for the Switcher
  const projectsQuery = useQuery({
    queryKey: ["projects", orgId],
    queryFn: async () => {
      ZmsApiClient.setContext(orgId);
      const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>(`/orgs/${orgId}/projects`);
      return res.data;
    },
    enabled: !!orgId,
  });
  const projects = projectsQuery.data || [];

  // 2. Fetch Services - Enabled only after Projects are ready
  const servicesQuery = useQuery({
    queryKey: ["services", orgId, projectId],
    queryFn: async () => {
      ZmsApiClient.setContext(orgId);
      const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/services`);
      return res.data;
    },
    enabled: !!orgId && !!projectId && showService && projectsQuery.isSuccess,
  });
  const services = servicesQuery.data || [];

  // 3. Fetch Environments - Enabled only after Services are ready
  const environmentsQuery = useQuery({
    queryKey: ["environments", orgId, projectId],
    queryFn: async () => {
      ZmsApiClient.setContext(orgId);
      const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>(`/projects/${projectId}/environments`);
      return res.data;
    },
    enabled: !!orgId && !!projectId && showEnv && servicesQuery.isSuccess,
  });
  const environments = environmentsQuery.data || [];

  const handleProjectChange = (id: string) => {
    const selected = projects.find((p: any) => p.id === id);
    if (selected) {
      setProject(selected);
      // Construct flat route with query parameters - Best Practice way
      const currentPath = window.location.pathname;
      router.push(`${currentPath}?oid=${orgId}&pid=${id}`);
    }
  };

  return (
    <div className=" mb-2">
      {title && (
        <h2 className="text-2xl font-black tracking-tighter text-foreground">
          {title}
        </h2>
      )}

      {description && (
        <p className="text-[10px] text-muted-foreground/40 font-mono italic lowercase tracking-tight">
          // {description}
        </p>
      )}

      {(showProject || showService || showEnv) && (
        <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-widest bg-muted/20 p-2.5 rounded-xl border border-border/40 backdrop-blur-sm w-fit">
          {/* Project Selector */}
          {showProject && (
            <div className="flex items-center gap-2">
              <span className="opacity-40 font-bold">Project:</span>
              <Select value={projectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="h-8 px-3 py-1.5 border-none bg-muted/40 hover:bg-muted/60 focus:ring-0 w-auto font-black text-foreground rounded-lg transition-colors flex items-center gap-2">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showService && (
            <>
              {(showProject) && <span className="opacity-20 select-none">|</span>}
              <div className="flex items-center gap-2">
                <span className="opacity-40 font-bold">Service:</span>
                <Select
                  value={activeServiceId || ""}
                  onValueChange={(val) => (val === "ADD_NEW" ? onAddService?.() : onServiceChange?.(val))}
                >
                  <SelectTrigger className="h-8 px-3 py-1.5 border-none bg-muted/40 hover:bg-muted/60 focus:ring-0 w-auto font-black text-primary transition-all flex items-center gap-2 rounded-lg">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {services.map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                        {s.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator className="bg-muted" />
                    <SelectItem value="ADD_NEW" className="text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer">
                      <Plus className="w-3 h-3 mr-2 inline" />
                      Add Service
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {showEnv && (
            <>
              <span className="opacity-20 select-none">|</span>
              <div className="flex items-center gap-2">
                <span className="opacity-40 font-bold">Environment:</span>
                <Select value={activeEnv || ""} onValueChange={onEnvChange}>
                  <SelectTrigger className="h-8 px-3 py-1.5 border-none bg-muted/40 hover:bg-muted/60 focus:ring-0 w-auto font-black text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 rounded-lg">
                    <SelectValue placeholder="Env" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {environments.map((env: any) => (
                      <SelectItem key={env.id} value={env.name} className="text-[10px] font-black uppercase tracking-widest cursor-pointer">
                        {env.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
