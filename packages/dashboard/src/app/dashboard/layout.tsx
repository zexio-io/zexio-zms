import { AppShell } from "@/ui/layouts/app-shell";
import { CommandPalette } from "@/ui/modules/command-palette";
import { AuthGuard } from "@/ui/components/auth/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
      <CommandPalette />
    </AuthGuard>
  );
}
