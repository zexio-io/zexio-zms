"use client";

import { useParams } from "next/navigation";
import { useZmsStore } from "@/infrastructure/state/store";
import { resolveOrgId } from "@/infrastructure/utils/utils";
import { ProjectGallery } from "@/ui/modules/project-gallery/project-gallery";
import { Badge } from "@/ui/components/badge";
import { ProjectHeader } from "@/ui/layouts/project-header";

export function WorkspaceProjectsClient() {
  const params = useParams();
  const { activeOrg } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);

  return (
    <div className="space-y-6">
      <ProjectHeader 
        title="Tactical Command"
        description="Zexio Managed Secrets (ZMS) Community Edition. Orchestrate your secure infrastructure vaults."
      />

      {/* 2. Tactical Project Gallery (DDD-Compliant) */}
      <ProjectGallery orgId={orgId} />

      {/* 3. Help / Information Section */}
      <div className="pt-10 border-t border-white/[0.05]">
          <div className="grid md:grid-cols-2 gap-6">
              <div className="p-8 rounded-[2.5rem] bg-card/40 border border-white/[0.03] backdrop-blur-2xl">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-primary/70 mb-2">Zero-Infrastructure</h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                      This Community Edition uses a local SQLite backbone for maximum portability. 
                      No clusters, no complex DB setup—just instant, tactical secret management.
                  </p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-card/40 border border-white/[0.03] backdrop-blur-2xl">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-primary/70 mb-2">Local Limits</h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                      ZMS CE is optimized for single-user dev teams. For multi-tenant clusters, RBAC, 
                      and enterprise compliance auditing, explore our Pro and Cloud editions.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
}
