"use client";

import { AlertTriangle, Home, RefreshCcw, ShieldAlert } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/infrastructure/utils/utils";
import Link from "next/link";

interface ErrorViewProps {
  code: number | string;
  title: string;
  description: string;
  digest?: string;
  reset?: () => void;
  className?: string;
}

export function ErrorView({
  code,
  title,
  description,
  digest,
  reset,
  className
}: ErrorViewProps) {
  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center",
      className
    )}>
      <div className="max-w-md w-full space-y-8">
        {/* Animated Icon Layer */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative p-6 rounded-[2.5rem] bg-card/40 backdrop-blur-xl border border-destructive/20 shadow-2xl">
            {code === 404 ? (
              <AlertTriangle className="w-16 h-16 text-destructive" />
            ) : (
              <ShieldAlert className="w-16 h-16 text-destructive" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-8xl font-black tracking-tighter opacity-10 font-mono select-none">
            {code}
          </h1>
          <h2 className="text-3xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground text-balanced leading-relaxed">
            {description}
          </p>
        </div>

        {digest && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-left overflow-x-auto">
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2">Error Diagnostic</p>
            <code className="text-xs font-mono text-zinc-400 break-all">
              {digest}
            </code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {reset && (
            <Button
              onClick={reset}
              className="w-full sm:w-auto gap-2 h-12 px-8 rounded-xl"
              variant="default"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          <Button
            asChild
            variant="secondary"
            className="w-full sm:w-auto gap-2 h-12 px-8 rounded-xl"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative Branding Footprint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 opacity-20 flex items-center gap-2 grayscale pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Zexio ZMS Engine</span>
      </div>
    </div>
  );
}
