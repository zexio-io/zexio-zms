"use client";

import { useZmsStore } from "@/infrastructure/state/store";
import { Button } from "@/ui/components/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Plus, LayoutGrid, List, Shield, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ZmsApiClient } from "@/infrastructure/api/api-client";

export function ProjectOverviewClient() {
  const { activeOrg, setProject } = useZmsStore();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ZmsApiClient.get<{ success: boolean; data: any[] }>("/projects"),
  });

  const activeProjects = orgs?.data.find(o => o.id === activeOrg?.id)?.projects || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">Manage secret health across your entire organization.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Grid
            </Button>
            <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-dashed backdrop-blur-sm bg-card/30">
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                </Card>
            ))
        ) : activeProjects.map((project: any) => (
            <Card key={project.id} className="group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-md overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Shield className="w-4 h-4 text-primary/40" />
                </div>
                <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 border group-hover:bg-primary transition-colors">
                        <Zap className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                    <CardDescription>{project.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {['Development', 'Staging', 'Production'].map((env) => (
                            <Badge key={env} variant="secondary" className="bg-muted/50 hover:bg-primary/20 cursor-pointer transition-colors text-[10px] uppercase font-bold tracking-tighter">
                                {env}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 py-3 flex justify-between items-center border-t border-transparent group-hover:border-primary/20">
                    <span className="text-xs text-muted-foreground">12 Secrets</span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 h-8 text-xs" 
                        asChild
                        onClick={() => setProject(project)}
                    >
                        <Link href={`/dashboard/p/secrets?pid=${project.id}`}>
                            Open Project
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        ))}
      </div>
    </div>
  );
}
