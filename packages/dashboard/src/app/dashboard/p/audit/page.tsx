"use client";

import { useParams } from "next/navigation";
import { AuditPortal } from "@/ui/modules/audit-portal/audit-portal";
import { ProjectHeader } from "@/ui/layouts/project-header";

export default function AuditPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  return (
    <div className="space-y-6">
      <ProjectHeader 
        title="Activity Log"
        description="Monitor security events and administrative actions specifically for this project."
      />

      <AuditPortal orgId={orgId} projectId={projectId} />
    </div>
  );
}
