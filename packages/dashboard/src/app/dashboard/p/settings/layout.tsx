export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
