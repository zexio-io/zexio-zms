"use client";

import { useProjects } from "@/application/hooks/use-projects";
import { useZmsStore } from "@/infrastructure/state/store";
import { Input } from "@/ui/components/input";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { Badge } from "@/ui/components/badge";
import Link from "next/link";
import { 
    Plus, 
    Search, 
    ChevronRight, 
    Box, 
    Layers, 
    Clock, 
    Globe,
    Zap
} from "lucide-react";
import { CreateProjectModal } from "./create-project-modal";

interface ProjectGalleryProps {
    orgId: string;
}

export function ProjectGallery({ orgId: propOrgId }: ProjectGalleryProps) {
    const { activeOrg, setProject } = useZmsStore();
    const orgId = propOrgId || activeOrg?.id || "";

    const { 
        projects, 
        isLoading, 
        searchTerm, 
        setSearchTerm, 
        hasResults 
    } = useProjects(orgId);

    return (
        <div className="space-y-8">
            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-lg w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                    <Input 
                        placeholder="Search infrastructure projects..." 
                        className="pl-12 h-12 bg-muted/20 border-none rounded-2xl focus:bg-muted/30 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <CreateProjectModal orgId={orgId}>
                    <Button className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                </CreateProjectModal>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-[220px] rounded-[2.5rem]" />
                    ))
                ) : (
                    <>
                        {projects.map((project) => (
                            <Link 
                                key={project.id}
                                href={`/dashboard/p/secrets?pid=${project.id}`}
                                onClick={() => setProject(project)}
                                className="group relative flex flex-col p-6 rounded-[2rem] border bg-card/40 backdrop-blur-xl hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden"
                            >
                                {/* Decorative Background Gradient */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:bg-primary/20 transition-all duration-700 blur-2xl" />
                                
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-lg text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                                        {project.name?.[0].toUpperCase()}
                                    </div>
                                    <div className="flex gap-1.5 translate-y-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        <div className="w-1 h-1 rounded-full bg-blue-500 opacity-20" />
                                        <div className="w-1 h-1 rounded-full bg-primary opacity-20" />
                                    </div>
                                </div>

                                <div className="space-y-1 flex-1">
                                    <h3 className="font-black text-lg tracking-tight group-hover:text-primary transition-colors duration-300">
                                        {project.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                                            ID: {project.id.split('-')[0]}
                                        </p>
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                                        <div className="flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-primary opacity-50" />
                                            <span className="text-[8px] font-black uppercase text-muted-foreground italic">
                                                {project.environments?.length || 3} Envs
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-muted-foreground opacity-30" />
                                        <span className="text-[9px] font-bold text-muted-foreground opacity-60">
                                            {project.updatedAt ? `Updated ${new Date(project.updatedAt).toLocaleDateString()}` : `Created ${new Date(project.createdAt).toLocaleDateString()}`}
                                        </span>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </>
                )}
            </div>

            {!hasResults && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-[3rem] border border-dashed border-muted/20">
                    <Box className="w-16 h-16 text-muted-foreground opacity-10 mb-6" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">No Projects Found</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-2">Try searching for a different keyword</p>
                </div>
            )}
        </div>
    );
}
