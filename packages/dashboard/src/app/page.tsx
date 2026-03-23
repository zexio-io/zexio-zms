"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/infrastructure/utils/utils";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/init-status`, {
          cache: 'no-store'
        });
        const data = await res.json();
        
        if (data.initialized) {
          router.replace("/login");
        } else {
          router.replace("/setup");
        }
      } catch (error) {
        // Fallback if API is down, let login page handle it
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkStatus();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
    </div>
  );
}
