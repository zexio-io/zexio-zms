"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useZmsStore } from "@/infrastructure/state/store";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { toast } from "sonner";
import { Badge } from "@/ui/components/badge";
import { useTheme } from "next-themes";
import { Skeleton } from "@/ui/components/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Input } from "@/ui/components/input";
import {
    Search,
    Plus,
    MoreVertical,
    CreditCard,
    Shield,
    Zap,
    BarChart3,
    Puzzle,
    Lock,
    History,
    Settings,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Layers,
    ShieldCheck,
    LogOut,
    Menu,
    X,
    Bell,
    User,
    Sun,
    Moon,
    Users,
    ChevronsUpDown,
    PlusCircle,
    Building2,
    Command,
    Key,
    Cpu
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const { activeOrg, activeProject, setOrg, setProject } = useZmsStore();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    const orgId = searchParams?.get('oid') || activeOrg?.id || "primary";
    const projectId = searchParams?.get('pid') || activeProject?.id || "default";
    const isProjectView = pathname.startsWith('/dashboard/p');

    const ORG_NAV_ITEMS = [
        { name: "Projects", href: `/dashboard/o/projects?oid=${orgId}`, icon: Layers },
        { name: "Audit Trail", href: `/dashboard/o/audit?oid=${orgId}`, icon: Shield, isPro: true },
        { name: "Rotations", href: `/dashboard/o/rotation?oid=${orgId}`, icon: Zap, isPro: true },
        { name: "Service Accounts", href: `/dashboard/o/service-accounts?oid=${orgId}`, icon: User, isPro: true },
        { name: "MCP", href: `/dashboard/o/mcp?oid=${orgId}`, icon: Cpu },
    ];


    const PROJECT_NAV_ITEMS = [
        { name: "Secrets", href: `/dashboard/p/secrets?pid=${projectId}`, icon: Lock },
        { name: "Environments", href: `/dashboard/p/environments?pid=${projectId}`, icon: Layers },
        { name: "Services", href: `/dashboard/p/services?pid=${projectId}`, icon: Zap },
        { name: "Tokens", href: `/dashboard/p/tokens?pid=${projectId}`, icon: Key },
        { name: "Activity", href: `/dashboard/p/activity?pid=${projectId}`, icon: History, isPro: true },
        { name: "Settings", href: `/dashboard/p/settings?pid=${projectId}`, icon: Settings },
    ];

    const { data: orgs, isLoading } = useQuery({
        queryKey: ["organizations"],
        queryFn: () => ZmsApiClient.get<{ success: boolean; data: any[] }>("/orgs"),
    });

    useEffect(() => {
        if (orgs?.success && orgs.data.length > 0) {
            const currentOrg = orgs.data.find((o) => o.id === orgId && o.id !== "primary") || orgs.data[0];
            setOrg(currentOrg);

            // Set Global API Context for Headers
            ZmsApiClient.setContext(currentOrg.id);

            // For static export compatibility, we no longer redirect away from the "primary" path.
            // Client state (setOrg) already handles the context for API calls.

            if (projectId && currentOrg.projects?.length > 0) {
                const currentProject = currentOrg.projects.find((p: any) => p.id === projectId);
                if (currentProject) setProject(currentProject);
            }
        }
    }, [orgs, orgId, projectId, setOrg, setProject, params.orgId, pathname, router]);

    const handleOrgChange = (org: any) => {
        setOrg(org);
        router.push(`/dashboard/o/projects?oid=${org.id}`);
    };

    return (
        <aside className="w-64 border-r bg-card/10 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-40 transition-all duration-300">

            {/* 1. Header: Organization Switcher (Global) */}
            <div className="p-4 border-b">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg group-hover:scale-105 transition-transform">
                                {activeOrg?.name?.[0].toUpperCase() || "W"}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold truncate leading-none">{activeOrg?.name || "My Workspace"}</p>
                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-black bg-primary/10 border-primary/20 text-primary">CE</Badge>
                                </div>
                                <p className="text-[9px] text-muted-foreground uppercase mt-1 font-black opacity-40 tracking-widest leading-none">Workspace</p>
                            </div>
                            <ChevronsUpDown className="w-3 h-3 text-muted-foreground opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 align-start border-primary/10 shadow-2xl backdrop-blur-xl bg-background/95 ml-2">
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest px-3 py-2 opacity-50">Switch Workspace</DropdownMenuLabel>
                        {orgs?.data.map((org: any, i: number) => (
                            <DropdownMenuItem
                                key={`org-switch-${org.id}-${i}`}
                                className="gap-3 py-2.5 cursor-pointer rounded-xl mx-1 my-0.5"
                                onSelect={() => handleOrgChange(org)}
                            >
                                <div className={`w-2 h-2 rounded-full ${org.id === activeOrg?.id ? 'bg-primary' : 'bg-muted'}`} />
                                <span className="flex-1 font-medium">{org.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">

                {/* VIEW A: ORGANIZATION SIDEBAR */}
                {!isProjectView && (
                    <div className="space-y-6">
                        <div className="space-y-1">
                            {ORG_NAV_ITEMS.map((item, i) => {
                                const isActive = pathname.startsWith(item.href) || (item.name === "Projects" && pathname.endsWith("/dashboard") && activeOrg?.id === orgId);
                                return (
                                    <Link
                                        key={`org-nav-${item.name}-${i}`}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${isActive
                                            ? "bg-primary/5 text-primary font-semibold"
                                            : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`} />
                                        <span className="flex-1">{item.name}</span>
                                        {item.isPro && (
                                            <Badge variant="outline" className="text-[7px] h-3 px-1 font-black bg-primary/10 border-primary/20 text-primary opacity-70">PRO</Badge>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="pt-4 border-t space-y-1">
                            <Link
                                href={`/dashboard/o/settings?oid=${orgId}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${pathname.includes("/o/settings")
                                    ? "bg-primary/5 text-primary font-semibold"
                                    : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                <Settings className={`w-4 h-4 ${pathname.includes("/o/settings") ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`} />
                                <span className="flex-1">Workspace Settings</span>
                            </Link>
                        </div>

                    </div>
                )}

                {/* VIEW B: PROJECT SIDEBAR */}
                {isProjectView && (
                    <div className="space-y-8">
                        <button
                            onClick={() => router.push(`/dashboard/o/projects?oid=${orgId}`)}
                            className="flex items-center gap-2 px-3 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors group"
                        >
                            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                            Back to Workspace
                        </button>

                        <div className="space-y-1">
                            <div className="px-3 mb-6">
                                <div className="flex flex-col gap-1 px-3 py-3 rounded-2xl bg-primary/5 border border-primary/10">
                                    <span className="text-[8px] font-black uppercase text-primary tracking-widest opacity-70">Active Project</span>
                                    <span className="text-xs font-black truncate">{activeProject?.name || "ZMS Backend"}</span>
                                </div>
                            </div>

                            {PROJECT_NAV_ITEMS.map((item, i) => {
                                const isActive = pathname.includes(item.href);
                                return (
                                    <Link
                                        key={`proj-nav-${item.name}-${i}`}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${isActive
                                            ? "bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span className="flex-1">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>

            {/* 4. Sidebar Footer: Edition Info */}
            <div className="p-4 border-t bg-muted/30 dark:bg-muted/10">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground uppercase tracking-wider">Edition</span>
                        <span className="text-foreground dark:text-primary font-black uppercase italic tracking-tight">Community</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 font-medium leading-tight">
                        ZMS Engine v1.0.0-ce. Tactical local development.
                    </p>
                </div>
            </div>
        </aside>
    );
}
