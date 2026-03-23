"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogDescription 
} from "@/ui/components/dialog";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Plus, Box, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "@/application/hooks/use-projects";

interface CreateProjectModalProps {
    orgId: string;
    children: React.ReactNode;
}

export function CreateProjectModal({ orgId, children }: CreateProjectModalProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const { createProjectMutation } = useProjects(orgId);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("Project name is required");
            return;
        }

        try {
            await createProjectMutation.mutateAsync({ name });
            toast.success("Project created successfully");
            setOpen(false);
            setName("");
        } catch (error: any) {
            toast.error(error.message || "Failed to create project");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-primary/10 rounded-[32px] overflow-hidden">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        <Box className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Initialize Vault</DialogTitle>
                    <DialogDescription className="text-xs font-medium opacity-60">
                        Deploy a new tactical infrastructure project. This will provision default environments (Dev, Staging, Prod) and core services.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="projectName" className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                            Project Name
                        </Label>
                        <Input 
                            id="projectName" 
                            placeholder="e.g. Apollo Engine" 
                            className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 font-bold"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-2"
                        disabled={createProjectMutation.isPending}
                    >
                        {createProjectMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        {createProjectMutation.isPending ? "Deploying..." : "Create Project"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
