"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Switch } from "@/ui/components/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/ui/components/select";
import { Plus, X, Upload, Info } from "lucide-react";
import { toast } from "sonner";

export function SecretComposer({ onSave }: { onSave?: () => void }) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [isSensitive, setIsSensitive] = useState(true);

  const handleSave = () => {
    if (!key || !value) {
      toast.error("Key and Value are required");
      return;
    }
    toast.success(`Secret ${key} created (Simulation)`);
    setKey("");
    setValue("");
    onSave?.();
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key</label>
          <Input 
              placeholder="CLIENT_KEY..." 
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="font-mono text-sm h-10"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Value</label>
          <Input 
              type="password"
              placeholder="••••••••••••••••" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono text-sm h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline w-fit font-semibold">
          <Plus className="w-3 h-3" />
          Add Another Variable
      </div>

      <div className="space-y-4 pt-6 border-t border-dashed">
          <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Environments</label>
              <Select defaultValue="all">
                  <SelectTrigger className="w-full">
                      <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
                              <Plus className="w-2 h-2" />
                          </div>
                          <SelectValue placeholder="Select Environment" />
                      </div>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Environments</SelectItem>
                      <SelectItem value="production">Production Only</SelectItem>
                      <SelectItem value="preview">Preview Only</SelectItem>
                      <SelectItem value="development">Development Only</SelectItem>
                  </SelectContent>
              </Select>
          </div>

          <div className="flex items-start space-x-3 pt-2">
              <Switch 
                  checked={isSensitive} 
                  onCheckedChange={setIsSensitive}
                  id="sensitive-mode"
                  className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label 
                    htmlFor="sensitive-mode"
                    className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                    Secret Masking
                    <Info className="w-3 h-3 text-muted-foreground" />
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Values will be encrypted and only visible to authorized roles.
                </p>
              </div>
          </div>
      </div>

      <div className="pt-8 flex flex-col gap-3">
        <Button className="w-full font-bold" onClick={handleSave}>Save Secret</Button>
        <Button variant="outline" className="w-full gap-2 text-xs">
            <Upload className="w-3 h-3" />
            Import from .env file
        </Button>
      </div>
    </div>
  );
}
