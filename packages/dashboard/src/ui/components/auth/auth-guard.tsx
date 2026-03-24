"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check localStorage for the session token
    const token = localStorage.getItem("zms.session_token");
    const isLoginPage = pathname === "/login" || pathname === "/register";

    if (!token && !isLoginPage) {
      console.log("🛡️ AuthGuard: No token found, redirecting to login");
      router.replace("/login");
    } else if (token && isLoginPage) {
      console.log("🛡️ AuthGuard: Token found on login page, redirecting to dashboard");
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Authenticating Protocol...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
