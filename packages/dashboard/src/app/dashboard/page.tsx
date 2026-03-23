"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useZmsStore } from "@/infrastructure/state/store";
import { ZmsApiClient } from "@/infrastructure/api/api-client";

export default function DashboardRootPage() {
  const router = useRouter();
  const { activeOrg } = useZmsStore();

  useEffect(() => {
    const resolveOrg = async () => {
      try {
        const res = await ZmsApiClient.get<{ success: boolean; data: any[] }>("/orgs");
        if (res.success && res.data.length > 0) {
          // For static export compatibility, we always route to /dashboard/o/projects
          // The resolveOrgId utility and client state will handle the actual data fetching.
          router.replace(`/dashboard/o/projects`);
        } else {
          router.replace("/setup");
        }
      } catch (e) {
        router.replace("/login");
      }
    };

    resolveOrg();
  }, [activeOrg, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Initializing Context...</p>
      </div>
    </div>
  );
}
