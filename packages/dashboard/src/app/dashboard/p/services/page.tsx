"use client";

import { useParams } from "next/navigation";
import { Zap } from "lucide-react";
import { ServiceList } from "@/ui/modules/service-list";
import { ProjectHeader } from "@/ui/layouts/project-header";

export default function ServiceTokensPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      <ProjectHeader 
        title="Services"
        description="Manage microservices and applications with unique security identities."
      />

      {/* Main Console */}
      <div className="grid gap-6">
        <ServiceList />
      </div>
    </div>
  );
}
