"use client";

import { Tabs, TabsList, TabsTrigger } from "@/ui/components/tabs";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";
import { useZmsStore } from "@/infrastructure/state/store";

export function SettingsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { activeOrg, activeProject } = useZmsStore();

  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);

  // Sync search params to maintain context on tab switch
  const oid = searchParams.get('oid') || orgId;
  const pid = searchParams.get('pid') || projectId;
  const querySuffix = `?oid=${oid}${pid ? `&pid=${pid}` : ""}`;

  const tabs = projectId 
    ? [
        { name: "General", href: `/dashboard/p/settings${querySuffix}` },
        { name: "Security", href: `/dashboard/p/settings/security${querySuffix}` },
        { name: "Webhooks", href: `/dashboard/p/settings/webhooks${querySuffix}` },
      ]
    : [
        { name: "Workspace Identity", href: `/dashboard/o/settings${querySuffix}` },
      ];

  return (
    <Tabs value={pathname} className="w-full">
      <TabsList variant={'line'} className=" w-full justify-start h-auto p-0 gap-6 border-b-0">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <TabsTrigger
              value={tab.href.split('?')[0]} // Match path without query
              className="rounded-none data-[state=active]:bg-transparent px-1 text-xs font-bold uppercase tracking-widest transition-none h-10 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              {tab.name}
            </TabsTrigger>
          </Link>
        ))}
      </TabsList>
    </Tabs>
  );
}
