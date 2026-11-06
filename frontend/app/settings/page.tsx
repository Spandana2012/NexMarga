import { Bell, LockKeyhole, Palette, SlidersHorizontal } from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { GlassCard } from "@/components/ui/card";

const settings = [
  { title: "Workspace preferences", copy: "Theme, density, and dashboard display defaults.", icon: Palette },
  { title: "AI behavior", copy: "Mock controls for tone, depth, and recommendation style.", icon: SlidersHorizontal },
  { title: "Notifications", copy: "Digest and agent-completion notification placeholders.", icon: Bell },
  { title: "Privacy", copy: "Future consent, data retention, and document access controls.", icon: LockKeyhole },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <TopNavbar
        title="Settings"
        description="A polished placeholder settings surface prepared for future account and AI preferences."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((setting) => {
          const Icon = setting.icon;

          return (
          <GlassCard key={setting.title} className="rounded-[1.75rem] p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/25">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-400/10 text-fuchsia-100">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white">{setting.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{setting.copy}</p>
              </div>
            </div>
          </GlassCard>
          );
        })}
      </div>
    </AppShell>
  );
}
