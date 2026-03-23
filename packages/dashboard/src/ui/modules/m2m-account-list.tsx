"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { Plus, Shield, Globe, Lock, Trash2, Settings2, Fingerprint } from "lucide-react";
import { Card, CardContent } from "@/ui/components/card";

export function ServiceAccountList() {
  const params = useParams();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["service_accounts", params.orgId],
    queryFn: () => ZmsApiClient.get<{ success: boolean; data: any[] }>(`/service-accounts?orgId=${params.orgId}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Service Accounts</h3>
          <p className="text-sm text-muted-foreground italic">Best for CI/CD, production clusters, and shared infrastructure.</p>
        </div>
        <Button variant="outline" className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold gap-2">
          <Plus className="w-4 h-4" />
          Create Service Account
        </Button>
      </div>

      {(accounts?.data.length === 0) ? (
        <Card className="border-dashed bg-muted/20 border-2 rounded-3xl py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary/40" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold">No Service Accounts yet</h4>
              <p className="text-sm text-muted-foreground">managed identities for enterprise workloads.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts?.data.map((account: any) => (
            <div 
              key={account.id}
              className="flex items-center justify-between p-6 rounded-3xl border bg-card/40 backdrop-blur-md hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Fingerprint className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{account.name}</span>
                        {account.projectId ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-black uppercase text-center">Project Scoped</span>
                        ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-black uppercase text-center">Global Org</span>
                        )}
                    </div>
                    <code className="text-[10px] bg-muted px-2 py-1 rounded-md text-muted-foreground block w-fit">
                        {account.clientId}
                    </code>
                 </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary">
                    <Settings2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
