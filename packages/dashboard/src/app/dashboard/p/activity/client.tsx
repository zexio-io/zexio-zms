"use client";

import { useParams } from "next/navigation";
import { Activity, ShieldCheck, Search } from "lucide-react";
import { AuditPortal } from "@/ui/modules/audit-portal/audit-portal";
import { useZmsStore } from "@/infrastructure/state/store";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";

export function ProjectActivityClient() {
  const params = useParams();
  const { activeOrg, activeProject } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary group">
            <div className="p-2.5 rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-lg shadow-primary/5">
                <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Project Activity</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Forensic telemetry for <span className="text-foreground font-bold italic">{activeProject?.name || projectId}</span>. 
            Monitor secret access patterns, environment changes, and service account delegations in real-time.
          </p>
        </div>
      </div>

      {/* 2. Tactical Forensic Portal (Project-Scoped) */}
      <AuditPortal orgId={orgId} projectId={activeProject?.id} />

      {/* 3. Project Context Footer */}
      <div className="pt-10 border-t border-white/[0.05]">
          <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <ShieldCheck className="w-8 h-8 text-green-500/30" />
                 <div className="space-y-1">
                     <h4 className="font-black text-xs uppercase tracking-widest text-primary">Isolation Verified</h4>
                     <p className="text-[10px] text-muted-foreground leading-relaxed max-w-md">
                        This view is strictly filtered to events occurring within this project. organization-wide 
                        events are excluded from this telemetry feed to ensure zero-bleed compliance.
                     </p>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
}
