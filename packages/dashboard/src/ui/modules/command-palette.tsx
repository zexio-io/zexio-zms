"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/ui/components/command";
import { 
    Search, 
    Lock, 
    History, 
    Shield, 
    Zap, 
    Plus,
    CreditCard,
    User,
    Settings,
    LogOut
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useZmsStore } from "@/infrastructure/state/store";
import { signOut } from "@/infrastructure/auth/auth-client";
import { resolveOrgId, resolveProjectId } from "@/infrastructure/utils/utils";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const params = useParams();
  const { activeOrg, activeProject } = useZmsStore();

  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const projectId = resolveProjectId(params.projectId, activeProject?.id);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push(`/dashboard/${orgId}/p/${projectId}/secrets`))}>
            <Lock className="mr-2 h-4 w-4" />
            <span>Browse Secrets</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/dashboard/${orgId}/p/${projectId}/audit`))}>
            <History className="mr-2 h-4 w-4" />
            <span>View Activity Logs</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/dashboard/${orgId}/p/${projectId}/rotations`))}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Manage Rotations</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push(`/dashboard/${orgId}/p/${projectId}/settings`))}>
            <User className="mr-2 h-4 w-4" />
            <span>Manage Project</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/dashboard/${orgId}/p/${projectId}/settings/billing`))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing & Subscription</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push(`/dashboard/${orgId}/p/${projectId}/settings/developer`))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Developer Portal</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Shortcuts">
            <CommandItem>
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New Project</span>
            </CommandItem>
            <CommandItem 
                className="text-red-500"
                onSelect={() => runCommand(async () => {
                    await signOut();
                })}
            >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
            </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
