"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { ServiceTokenList } from "@/ui/modules/m2m-token-list";
import { Zap, ChevronRight, Activity, ShieldCheck, Calendar } from "lucide-react";
import { Skeleton } from "@/ui/components/skeleton";

import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
import { useZmsStore } from "@/infrastructure/state/store";

export default function ServiceDetailPage() {
  const { activeOrg, activeProject } = useZmsStore();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const orgId = resolveOrgId(undefined, activeOrg?.id);
  const projectId = resolveProjectId(undefined, activeProject?.id);
  const serviceId = searchParams?.get('sid') || "default";

  const { data: service, isLoading } = useQuery({
    queryKey: ["service_detail", serviceId],
    queryFn: () => ZmsApiClient.get<{ success: boolean; data: any }>(`/orgs/${orgId}/projects/${projectId}/services/${serviceId}`),
    enabled: !!orgId && orgId !== "primary" && !!projectId && projectId !== "default" && !!serviceId && serviceId !== "default",
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
          <a href={`/dashboard/p/services?pid=${projectId}`} className="hover:text-primary transition-colors">Services</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary/60">{service?.data.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 fill-primary/20" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter italic uppercase">{service?.data.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/50">
             <div className="px-4 py-2 text-center border-r border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-tight">Active Identity</span>
                </div>
             </div>
             <div className="px-4 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Created</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[11px] font-semibold">{new Date(service?.data.createdAt).toLocaleDateString()}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-[2rem] bg-card/40 border backdrop-blur-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Service Overview</h4>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tight">System Identity</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">This service can be used for Machine-to-Machine authentication.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-tight">Audit Scoped</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">All secrets accessed by this service are logged under this identity.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Tokens Area */}
        <div className="lg:col-span-3">
            <ServiceTokenList serviceId={serviceId as string} />
        </div>
      </div>
    </div>
  );
}
