"use client";

import { BarChart3, Clock3, Smartphone, Monitor, Tablet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsOverview } from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const analyticsQuery = useAnalyticsOverview();

  if (analyticsQuery.isLoading || !analyticsQuery.data) {
    return (
      <div className="space-y-6">
        <SectionHeading title="Analytics" subtitle="Live engagement telemetry and access insights." />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { timeline, deviceBreakdown, topFiles } = analyticsQuery.data;
  const maxScans = Math.max(...timeline.map((point) => point.scans), 1);

  return (
    <div className="space-y-6">
      <SectionHeading title="Analytics" subtitle="Scan timeline, file engagement, and device behavior." />

      <Card className="border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart3 className="h-4 w-4 text-primary" />
          Scan timeline (7 days)
        </div>

        <div className="grid gap-2">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scan activity yet.</p>
          ) : (
            timeline.map((point) => (
              <div key={point.date} className="flex items-center gap-3">
                <span className="w-24 text-xs text-muted-foreground">{point.date}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max((point.scans / maxScans) * 100, 6)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-foreground">{point.scans}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock3 className="h-4 w-4 text-primary" />
            Device breakdown
          </div>

          <div className="space-y-3 text-sm">
            <DeviceRow label="Desktop" value={deviceBreakdown.desktop ?? 0} icon={<Monitor className="h-4 w-4" />} />
            <DeviceRow label="Mobile" value={deviceBreakdown.mobile ?? 0} icon={<Smartphone className="h-4 w-4" />} />
            <DeviceRow label="Other" value={deviceBreakdown.other ?? 0} icon={<Tablet className="h-4 w-4" />} />
          </div>
        </Card>

        <Card className="border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Most active files</h3>
          <div className="space-y-2">
            {topFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No file engagement yet.</p>
            ) : (
              topFiles.map((file) => (
                <div key={file.id} className="rounded-md border border-border bg-background/50 px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.meeting.title} • {file.versions} versions
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DeviceRow({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

