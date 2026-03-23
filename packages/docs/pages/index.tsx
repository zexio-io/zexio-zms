import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Server, Key, Zap, Globe, Lock, Cpu, Bot } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ReactNode } from 'react';

function cx(...args: (string | undefined | null | false)[]) {
  return twMerge(clsx(...args));
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <Head>
        <title>ZMS — The Open-Source Zero-Trust Secret Manager</title>
        <meta name="description" content="Agentic-Ready secret management for modern infrastructure and AI agents." />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-x-0 border-t-0 rounded-none bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary">
              <Key size={18} />
            </div>
            Zexio ZMS
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/docs" className="text-foreground/70 hover:text-foreground transition-colors">Docs</Link>
            <a href="https://github.com/mimamghozalie/zexio-zms" target="_blank" rel="noreferrer" className="text-foreground/70 hover:text-foreground transition-colors">GitHub</a>
            <Link href="/docs" className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-glow font-medium transition-colors shadow-lg shadow-primary/20">
              Initialize Vault
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute inset-0 top-0 bg-hero-glow -z-10 pointer-events-none" />
        
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={stagger}
          className="max-w-7xl mx-auto px-6 text-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-sm font-medium text-primary mb-8 border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Agentic-Ready Infrastructure
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Zero-Trust Secrets for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              AI & Infrastructure
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            Eliminate plaintext `.env` files. ZMS provides a self-hosted, standalone vault with native MCP support for AI Agents. Secure your keys, anywhere.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs" className="h-12 px-8 rounded-full bg-primary hover:bg-primary-glow text-white font-medium flex items-center justify-center transition-all shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-primary/40">
              Get Started
            </Link>
            <a href="https://github.com/mimamghozalie/zexio-zms" target="_blank" rel="noreferrer" className="h-12 px-8 rounded-full glass-panel font-medium flex items-center justify-center hover:bg-surface-subtle transition-colors">
              Read the Source
            </a>
          </motion.div>
        </motion.div>

        {/* Mock Terminal/Dash Visualization focusing on Agentic Flow */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="max-w-5xl mx-auto px-6 mt-20"
        >
          <div className="glass-panel w-full min-h-[520px] rounded-2xl overflow-hidden relative shadow-2xl shadow-primary/10">
            <div className="h-10 border-b border-border/50 bg-surface/50 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs font-mono text-foreground/40 text-glow">zexio-zms — agent-runtime</span>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed">
              <div className="text-primary-glow">$ npm i -g @zexio/zms-cli</div>
              <div className="text-green-400 mt-1">✔ Installed ZMS CLI v1.0.0</div>
              <br />
              <div className="text-primary-glow">$ zms start</div>
              <div className="text-foreground/80 mt-1">Starting Zexio ZMS Core...</div>
              <div className="text-green-400 mt-1">✔ Zero-Trust Vault live (Port: 3030)</div>
              <br />
              <div className="text-blue-400">Agentic Interaction:</div>
              <div className="text-foreground/60 mt-1 italic">&quot;User: use mcp zms to sync my .env.local to project store and service store-api&quot;</div>
              <div className="text-foreground/80 mt-1">🔍 Scanning .env.local... found 12 secrets.</div>
              <div className="text-primary-glow mt-1">→ Executing bulk_save_secrets(projectId: &quot;store&quot;, ...)</div>
              <div className="text-green-400 mt-1">✅ 12 secrets secured in Store:Store-API.</div>
              <div className="text-foreground/80 mt-3 border border-primary/30 bg-primary/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary font-bold">Bootstrap Action Required:</span>
                </div>
                <div className="text-foreground/60 mb-2">1. Replace your <span className="text-white">.env.local</span> content with:</div>
                <code className="text-primary-glow mb-4 block p-2 bg-background/50 rounded border border-primary/20">ZMS_TOKEN=zms_st_hq9823nf...</code>
                <div className="text-foreground/60 mb-2">2. Update your start script in <span className="text-white">package.json</span>:</div>
                <code className="text-primary-glow block p-2 bg-background/50 rounded border border-primary/20">zms run -- node server.js</code>
              </div>
              <br/>
              <div className="text-green-400 font-bold">🚀 System Secured. Plaintext leaks eliminated.</div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bento Grid Features */}
      <section className="py-24 bg-surface/30 border-y border-border/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-balance">Built for the Agentic Era</h2>
             <p className="text-foreground/60 max-w-2xl mx-auto">ZMS leverages modern cryptographic standards and native AI protocols to ensure your secrets remain secure and ready for your agents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BentoCard 
              icon={<Bot className="text-primary" />}
              title="MCP Native for AI Agents"
              description="The first secret manager with full Model Context Protocol support. Allow your AI Agents to securely retrieve secrets without manual input."
              className="md:col-span-2"
            />
            <BentoCard 
              icon={<Shield className="text-blue-400" />}
              title="Zero-Trust Logic"
              description="End-to-end encryption. Your master keys never leave your controlled environment."
            />
            <BentoCard 
              icon={<Zap className="text-yellow-400" />}
              title="Bootstrap Pattern"
              description="Replace dangerous multiline .env files with a single token. Eliminate secret leakage instantly."
            />
            <BentoCard 
              icon={<Cpu className="text-green-400" />}
              title="Standalone Performance"
              description="No cloud dependency. Ultra-fast, stateless architecture designed for self-hosting and scaling independently."
              className="md:col-span-2"
            />
          </div>
        </div>
      </section>

      {/* Agentic Integration Step-by-step */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-20">
             <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Empower Your Agents</h2>
             <p className="text-foreground/60">The complete lifecycle for modern AI-driven infrastructure.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent -z-10" />
            
            <StepCard 
              number="01"
              title="Initialize Vault"
              description="Deploy and start the ZMS Core engine using 'zms start' to launch your Zero-Trust environment."
              icon={<Lock size={20} />}
            />
            <StepCard 
              number="02"
              title="Secure & Sync"
              description="Manage secrets via the ZMS Dashboard or let AI Agents sync them automatically via MCP."
              icon={<Key size={20} />}
            />
            <StepCard 
              number="03"
              title="Inject & Run"
              description="Securely inject secrets into any process using the 'zms run' command or native SDKs."
              icon={<Zap size={20} />}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Footer */}
      <footer className="py-12 border-t border-border/50 text-center">
        <p className="text-foreground/60 mb-6">Built for the future of Agentic-First and Zero-Trust infrastructure.</p>
        <div className="flex justify-center gap-6 text-sm text-foreground/40">
          <Link href="/docs" className="hover:text-foreground transition-colors text-primary">Explore ZMS Docs</Link>
          <a href="https://github.com/zexio-io/zexio-zms" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({ icon, title, description, className }: { icon: ReactNode, title: string, description: string, className?: string }) {
  return (
    <div className={cx("glass-panel p-8 relative overflow-hidden group hover:border-primary/30 transition-colors h-full", className)}>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform scale-150 translate-x-1/4 -translate-y-1/4">
        {icon}
      </div>
      <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 relative z-10">{title}</h3>
      <p className="text-foreground/60 relative z-10 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { number: string, title: string, description: string, icon: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center relative">
       <div className="w-16 h-16 rounded-full glass-panel bg-background flex items-center justify-center text-primary font-bold text-xl mb-6 relative shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-primary/20 transition-all hover:scale-105">
         {number}
       </div>
       <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
         {icon} {title}
       </h3>
       <p className="text-foreground/60 leading-relaxed max-w-xs">{description}</p>
    </div>
  );
}
