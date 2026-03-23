"use client";

import { Zap } from "lucide-react";
import { Switch } from "@/ui/components/switch";
import { useUIStore } from "@/infrastructure/state/store";

export function ToneToggle() {
  const { uiMode, setUiMode } = useUIStore();

  return (
    <div className="absolute top-6 right-6 flex items-center gap-2 bg-background/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg scale-90 md:scale-100 z-50">
      <Zap className={`w-3 h-3 ${uiMode === 'tactical' ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className="text-[10px] font-black uppercase tracking-tighter">Tactical Mode</span>
      <Switch 
        checked={uiMode === 'tactical'} 
        onCheckedChange={(checked) => setUiMode(checked ? 'tactical' : 'standard')}
        size="sm"
      />
    </div>
  );
}
