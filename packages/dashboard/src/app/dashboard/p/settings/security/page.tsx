"use client";

import { useZmsStore } from "@/infrastructure/state/store";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { toast } from "sonner";
import { ShieldAlert, Trash2 } from "lucide-react";

export default function ProjectSettingsPage() {
  const { activeProject } = useZmsStore();

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Security Policies</h3>
          <div className="grid gap-6 p-6 rounded-xl border bg-card">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input key={activeProject?.id} defaultValue={activeProject?.name || ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">app.zms.io/</span>
                <Input key={activeProject?.id} defaultValue={activeProject?.id || ""} className="font-mono text-xs" readOnly />
              </div>
            </div>
            <Button size="sm" className="w-fit" onClick={() => toast.success("Project updated (Simulation)")}>Save Changes</Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Danger Zone</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Deleting this project will permanently remove all associated secrets, history, and rotation policies. This action cannot be undone.
          </p>
          <Button 
            variant="destructive" 
            size="sm" 
            className="gap-2"
            disabled={true} // Simulation: Only Admins can delete
          >
            <Trash2 className="w-4 h-4" />
            Delete Project (Admin Only)
          </Button>
        </div>
      </section>
    </div>
  );
}
