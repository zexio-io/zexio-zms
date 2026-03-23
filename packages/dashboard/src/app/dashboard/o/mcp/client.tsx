"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Cpu, Key, Copy, Check, Zap, Plus, Loader2, Trash2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { toast } from "sonner";
import { ZmsApiClient } from "@/infrastructure/api/api-client";
import { getApiBaseUrl } from "@/infrastructure/utils/utils";
import { useOrganization } from "@/application/hooks/use-organization";
import { Skeleton } from "@/ui/components/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/ui/components/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/components/accordion";

import { useZmsStore } from "@/infrastructure/state/store";
import { resolveOrgId } from "@/infrastructure/utils/utils";

export function McpIntegrationClient() {
  const params = useParams();
  const { activeOrg } = useZmsStore();
  const orgId = resolveOrgId(params.orgId, activeOrg?.id);
  const { organization, isLoading: isOrgLoading } = useOrganization(orgId);

  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastGeneratedToken, setLastGeneratedToken] = useState<{ id: string; token: string } | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<any | null>(null);

  const apiBase = getApiBaseUrl();
  const baseUrl = typeof window !== 'undefined'
    ? (apiBase.startsWith('http') ? apiBase.replace(/\/v1$/, '') : `${window.location.origin}${apiBase.replace(/\/v1$/, '')}`)
    : apiBase.replace(/\/v1$/, '');

  const fetchTokens = async () => {
    if (!organization?.id) return;
    try {
      const res = await ZmsApiClient.get<{ success: boolean, data: any[] }>(`/orgs/${organization.id}/mcp-tokens`);
      setTokens(res.data);
    } catch (e) {
      toast.error("Failed to load tokens");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      fetchTokens();
    }
  }, [organization?.id]);

  const generateToken = async () => {
    if (!organization?.id) return;
    setIsGenerating(true);
    try {
      const name = "mcp-commander-" + Math.floor(Math.random() * 1000);
      const res = await ZmsApiClient.post<{ success: boolean; data: any; token: string }>(
        `/orgs/${organization.id}/mcp-tokens`,
        { name }
      );

      setTokens([res.data, ...tokens]);
      setLastGeneratedToken({ id: res.data.id, token: res.token });
      toast.success("MCP Token generated and persisted to database");
    } catch (e) {
      toast.error("Failed to generate token");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!organization?.id) return;
    try {
      await ZmsApiClient.delete(`/orgs/${organization.id}/mcp-tokens/${tokenId}`);
      setTokens(tokens.filter(t => t.id !== tokenId));
      if (lastGeneratedToken?.id === tokenId) setLastGeneratedToken(null);
      toast.success("Token revoked");
    } catch (e) {
      toast.error("Failed to revoke token");
    }
  };

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    toast.success("Token copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isOrgLoading || (isLoading && organization)) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Cpu className="w-3 h-3" />
            AI Control Plane
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            MCP Integration
          </h1>
          <p className="text-muted-foreground text-sm font-medium max-w-lg">
            Connect your AI agents using the Model Context Protocol to manage secrets and infrastructure securely.
          </p>
        </div>

        <Button
          onClick={generateToken}
          disabled={isGenerating}
          className="h-12 px-8 rounded-xl font-bold shadow-sm"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="mr-2 w-5 h-5" /> Generate Token</>}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Active Integration Tokens</h2>
          <Badge variant="secondary" className="text-[10px] px-2 font-bold">{tokens.length} Active</Badge>
        </div>

        {tokens.length === 0 ? (
          <div className="h-40 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground space-y-2 bg-muted/5 dark:bg-muted/2">
            <Key className="w-6 h-6 opacity-30" />
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-40">No integration tokens active</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tokens.map((t) => {
              const isNewlyGenerated = lastGeneratedToken?.id === t.id;
              const displayToken = (isNewlyGenerated && lastGeneratedToken) ? lastGeneratedToken.token : `${t.lastFour}••••••••••••••••`;

              return (
                <div key={t.id} className="group p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted dark:bg-muted/50 flex items-center justify-center border border-border">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-tight">{t.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Created {new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-colors border ${isNewlyGenerated ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted text-muted-foreground/80 border-border'}`}>
                      {displayToken}
                    </code>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={!isNewlyGenerated}
                        className="w-9 h-9 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-colors"
                        onClick={() => (isNewlyGenerated && lastGeneratedToken) && copyToClipboard(lastGeneratedToken.token, t.id)}
                      >
                        {copiedId === t.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-9 h-9 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-colors"
                        onClick={() => setTokenToDelete(t)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <div className="px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tactical Connections</h2>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-2 border-none">
          <AccordionItem value="sse-url" className="rounded-2xl border bg-card overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold italic">SSE Endpoint URL</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use this URL as the unified command center for any MCP-compliant agent.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-[11px] font-mono text-primary truncate border border-border">
                    {baseUrl}/mcp/sse
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-9 h-9 rounded-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(`${baseUrl}/mcp/sse`);
                      toast.success("Endpoint URL copied");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cursor" className="rounded-2xl border bg-card overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold italic">Cursor Setup</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p>1. Open **Cursor Settings** &gt; **Models** &gt; **MCP Servers**.</p>
                <p>2. Click **Add New MCP Server** and set:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Name: <code className="text-primary">ZMS</code></li>
                  <li>Type: <code className="text-primary font-bold">sse</code></li>
                  <li>URL: <code className="text-primary italic">{baseUrl}/mcp/sse</code></li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="antigravity" className="rounded-2xl border bg-card overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold italic">Antigravity</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">JSON Configuration for Antigravity integration:</p>
                <pre className="p-3 rounded-xl bg-muted/50 dark:bg-black text-[10px] font-mono text-primary overflow-x-auto shadow-inner border border-border/50">
                  {`{
  "mcpServers": {
    "zms": {
      "serverUrl": "${baseUrl}/mcp",
      "headers": {
        "Authorization": "Bearer ${lastGeneratedToken?.token || 'mcp_token'}"
      }
    }
  }
}`}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="claude" className="rounded-2xl border bg-card overflow-hidden">
            <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold italic">Claude Desktop</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Add this to your <code className="text-foreground font-bold">claude_desktop_config.json</code>:</p>
                <pre className="p-3 rounded-xl bg-muted/50 dark:bg-black text-[10px] font-mono text-green-600 dark:text-green-400 overflow-x-auto border border-border/50">
                  {`{
  "mcpServers": {
    "zms": {
      "url": "${baseUrl}/mcp",
      "type": "http",
      "headers": {
        "Authorization": "Bearer ${lastGeneratedToken?.token || 'mcp_token'}"
      }
    }
  }
}`}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <AlertDialog open={!!tokenToDelete} onOpenChange={(open) => !open && setTokenToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Revoke Integration Token?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This action will immediately terminate the connection for AI agents using the <strong>{tokenToDelete?.name}</strong> token.
              This operation is final and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <div className="hidden" />
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
              onClick={() => {
                if (tokenToDelete) {
                  deleteToken(tokenToDelete.id);
                  setTokenToDelete(null);
                }
              }}
            >
              Confirm Revocation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
