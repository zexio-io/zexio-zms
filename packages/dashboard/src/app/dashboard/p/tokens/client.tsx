"use client";

import { useParams } from "next/navigation";
import { Key } from "lucide-react";
import { ServiceTokenList } from "@/ui/modules/m2m-token-list";
import { ProjectHeader } from "@/ui/layouts/project-header";

export function ProjectTokensClient() {
  return (
    <div className="space-y-6">
      <ProjectHeader 
        title="Project Tokens"
        description="Manage machine-to-machine identities for CI/CD and automated access across the project."
      />

      {/* Main Console */}
      <div className="grid gap-6">
        <ServiceTokenList />
      </div>
    </div>
  );
}
