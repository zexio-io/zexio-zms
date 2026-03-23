"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/ui/components/dropdown-menu";
import { Building2, LogOut, ChevronDown, Bell, BookOpen, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { authClient, signOut } from "@/infrastructure/auth/auth-client";
import { useZmsStore } from "@/infrastructure/state/store";
import { ChevronRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const { activeProject } = useZmsStore();

  useEffect(() => {
    const fetchUser = async () => {
      const session = await authClient.getSession();
      if (session.data?.user) {
        setUser(session.data.user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const getPageTitle = (path: string) => {
    if (path.endsWith("/secrets")) return "Secrets";
    if (path.endsWith("/settings")) return "Settings";
    if (path.endsWith("/audit")) return "Activity";
    if (path.endsWith("/tokens")) return "Tokens";
    if (path.endsWith("/services")) return "Services";
    if (path.endsWith("/environments")) return "Environments";
    if (path.endsWith("/projects")) return "Projects";
    if (path.endsWith("/rotations")) return "Rotations";
    if (path.includes("/mcp")) return "MCP";
    return "Dashboard";
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
        {activeProject && pathname.includes(`/p/${activeProject.id}`) ? (
          <>
            <span className="text-muted-foreground/50">{activeProject.name}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
            <span className="text-foreground">{pageTitle}</span>
          </>
        ) : (
          <span className="text-foreground text-sm font-black tracking-tighter normal-case">{pageTitle}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/docs"
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
        >
          <BookOpen className="w-4 h-4" />
          <span>Docs</span>
        </Link>

        <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground hover:text-primary transition-all group">
          <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background animate-pulse" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted/50 p-1.5 rounded-full transition-all group">
              <div className="relative">
                <Avatar className="w-8 h-8 border border-primary/20 bg-primary/5">
                  <AvatarImage src={user?.image} />
                  <AvatarFallback className="text-[10px] font-black uppercase tracking-tighter text-primary/60">
                    {user?.name?.slice(0, 2) || <UserIcon className="w-3.5 h-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 mt-2" align="end">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="w-10 h-10 border border-primary/20 bg-primary/5">
                <AvatarImage src={user?.image} />
                <AvatarFallback className="text-xs font-black uppercase tracking-tighter text-primary/60">
                  {user?.name?.slice(0, 2) || <UserIcon className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{user?.name || "Commander"}</span>
                <span className="text-[11px] text-muted-foreground">{user?.email || "zms-ce-admin@local"}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer py-2.5">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Account preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer py-2.5">
              <Badge variant="outline" className="w-4 h-4 p-0 flex items-center justify-center rounded-sm text-[8px] font-bold">🧪</Badge>
              <span className="text-sm font-medium">Feature previews</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer py-2.5">
              <span className="text-muted-foreground ml-0.5 font-bold">📋</span>
              <span className="text-sm font-medium">Changelog</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest px-2 py-2 opacity-50">Theme</DropdownMenuLabel>
            <DropdownMenuItem className="gap-3 cursor-pointer" onSelect={() => setTheme("dark")}>
              <div className={`w-1.5 h-1.5 rounded-full ml-1 ${theme === 'dark' ? 'bg-primary' : 'bg-transparent'}`} />
              <span className="text-sm">Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 cursor-pointer" onSelect={() => setTheme("light")}>
              <div className={`w-1.5 h-1.5 rounded-full ml-1 ${theme === 'light' ? 'bg-primary' : 'bg-transparent'}`} />
              <span className="text-sm">Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 cursor-pointer" onSelect={() => setTheme("system")}>
              <div className={`w-1.5 h-1.5 rounded-full ml-1 ${theme === 'system' ? 'bg-primary' : 'bg-transparent'}`} />
              <span className="text-sm">System</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer py-2.5 text-destructive font-medium"
              onSelect={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
