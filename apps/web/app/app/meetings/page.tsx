"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateMeetingModal } from "@/components/meeting/create-meeting-modal";
import { MeetingCard } from "@/components/meeting/meeting-card";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useMeetings } from "@/hooks/use-meetings";

export default function MeetingsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const meetingsQuery = useMeetings();
  const authQuery = useAuth();
  const canCreate = authQuery.data ? ["OWNER", "ADMIN", "EDITOR"].includes(authQuery.data.user.role) : false;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title="Meetings" subtitle="Create, share, and control access to live boardroom document portals." />
        <Button className="gap-2" disabled={!canCreate} onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New meeting
        </Button>
      </div>

      {meetingsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : meetingsQuery.data && meetingsQuery.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meetingsQuery.data.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-16 text-center text-sm text-muted-foreground">
          No meetings yet. Create your first meeting and distribute your first QR.
        </div>
      )}

      <CreateMeetingModal open={createOpen && canCreate} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

