"use client";

import Link from "next/link";
import { ArrowRight, Files, QrCode, ScanLine, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsOverview } from "@/hooks/use-analytics";
import { useMeetings } from "@/hooks/use-meetings";
import { formatBytes, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const overviewQuery = useAnalyticsOverview();
  const meetingsQuery = useMeetings();

  const stats = overviewQuery.data?.totals;

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Dashboard"
        subtitle="Overview of your active meetings, storage usage, and recent activity."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total meetings"
          value={stats?.totalMeetings}
          icon={<Files className="h-4 w-4" />}
          loading={overviewQuery.isLoading}
        />
        <MetricCard
          title="Active meetings"
          value={stats?.activeMeetings}
          icon={<QrCode className="h-4 w-4" />}
          loading={overviewQuery.isLoading}
        />
        <MetricCard
          title="Total scans"
          value={stats?.totalScans}
          icon={<ScanLine className="h-4 w-4" />}
          loading={overviewQuery.isLoading}
        />
        <MetricCard
          title="Storage used"
          value={stats ? formatBytes(stats.storageBytes) : undefined}
          icon={<Database className="h-4 w-4" />}
          loading={overviewQuery.isLoading}
        />
      </div>

      <Card className="border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent meetings</h2>
          <Link href="/app/meetings" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {meetingsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {meetingsQuery.data?.slice(0, 5).map((meeting) => (
              <Link
                href={`/app/meetings/${meeting.id}`}
                key={meeting.id}
                className="flex items-center justify-between rounded-md border border-border/80 bg-background/50 px-4 py-3 transition hover:border-primary/40"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {meeting.fileCount} files • {meeting.scanCount} scans • {formatDate(meeting.createdAt)}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{meeting.status}</span>
              </Link>
            ))}

            {meetingsQuery.data?.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No meetings created yet. Start by creating one in Meetings.
              </p>
            ) : null}
          </div>
        )}
      </Card>
    </div >
  );
}

function MetricCard({
  title,
  value,
  icon,
  loading
}: {
  title: string;
  value: string | number | undefined;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card className="border-border bg-card/90 p-4">
      <div className="mb-3 flex items-center justify-between text-muted-foreground">
        <p className="text-xs uppercase tracking-[0.1em]">{title}</p>
        {icon}
      </div>

      {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-semibold text-foreground">{value ?? 0}</p>}
    </Card>
  );
}

