"use client";

import { useParams } from "next/navigation";
import { History, ShieldCheck, Download } from "lucide-react";
import { AuditPortal } from "@/ui/modules/audit-portal/audit-portal";
import { Button } from "@/ui/components/button";
import { ProjectHeader } from "@/ui/layouts/project-header";

import { useZmsStore } from "@/infrastructure/state/store";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";

export function AuditClient() {
  const params = useParams();
  const { activeOrg, activeProject } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);

  return (
    <div className="space-y-6">
      <ProjectHeader 
        title="Security Audit"
        description="Immutable tracking of every tactical operation within your workspace."
      />

      <div className="flex items-end justify-end">
         <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl gap-2 border-primary/10 bg-primary/5 font-black uppercase text-[10px] tracking-widest text-primary">
            <Download className="w-4 h-4" />
            Export Logs
        </Button>
      </div>

      <AuditPortal orgId={orgId} projectId={projectId} />

      <div className="pt-10 border-t border-border/50">
          <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-primary">Forensic Integrity</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                      Audit logs are persisted in a secure database with actor-linked metadata. 
                      Every cryptographic action and architectural change is recorded with high-fidelity 
                      traceability for forensic analysis and historical accountability.
                  </p>
              </div>
              <div className="p-5 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-6 transition-all hover:bg-muted/40 group">
                  <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-background border border-border">
                          <ShieldCheck className="w-6 h-6 text-green-500/50 group-hover:text-green-500 transition-colors" />
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-tight">Forensic Verifiability</p>
                          <p className="text-[10px] text-muted-foreground font-medium italic">Linked to Authenticated Actor Identity</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
