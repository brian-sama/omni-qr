"use client";

import { Shield, Clock3, BellRing } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading title="Settings" subtitle="Security defaults, access posture, and operational controls." />

      <div className="grid gap-4 lg:grid-cols-3">
        <SettingCard
          icon={<Shield className="h-4 w-4" />}
          title="Session Security"
          description="HTTP-only cookie sessions and refresh-token rotation are enabled."
        />
        <SettingCard
          icon={<Clock3 className="h-4 w-4" />}
          title="Default Expiry"
          description="Set meeting auto-expiry in Access Settings per room."
        />
        <SettingCard
          icon={<BellRing className="h-4 w-4" />}
          title="Operational Alerts"
          description="Use Uptime Kuma and Sentry webhooks for proactive incident response."
        />
      </div>

      <Card className="border-border bg-card p-5 text-sm text-muted-foreground">
        Fine-grained audit retention, SCIM provisioning, and custom policy bundles can be layered as next enterprise
        milestones.
      </Card>
    </div>
  );
}

function SettingCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-border bg-card p-4">
      <div className="mb-2 inline-flex rounded-md bg-primary/15 p-2 text-primary">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

