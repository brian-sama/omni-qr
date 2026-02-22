"use client";

import Link from "next/link";
import { CalendarDays, FileText, Lock, QrCode, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, statusBadge } from "@/lib/utils";
import type { MeetingSummary } from "@/types";

function accessBadgeClass(accessType: MeetingSummary["accessType"]) {
  if (accessType === "PUBLIC") {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
  }

  if (accessType === "PASSWORD") {
    return "bg-amber-500/10 text-amber-200 border border-amber-500/30";
  }

  return "bg-slate-500/10 text-slate-300 border border-slate-500/30";
}

function accessIcon(accessType: MeetingSummary["accessType"]) {
  if (accessType === "PUBLIC") {
    return <ShieldCheck className="h-3.5 w-3.5" />;
  }

  if (accessType === "PASSWORD") {
    return <Lock className="h-3.5 w-3.5" />;
  }

  return <QrCode className="h-3.5 w-3.5" />;
}

export function MeetingCard({ meeting }: { meeting: MeetingSummary }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Link href={`/app/meetings/${meeting.id}`}>
        <Card className="group h-full border-border/70 bg-gradient-to-br from-card to-card/60 p-5 transition-all hover:border-primary/50 hover:shadow-glass">
          <div className="mb-3 flex items-center justify-between">
            <Badge className={statusBadge(meeting.status)}>{meeting.status}</Badge>
            <Badge className={accessBadgeClass(meeting.accessType)}>
              {accessIcon(meeting.accessType)}
              <span className="ml-1">{meeting.accessType}</span>
            </Badge>
          </div>

          <h3 className="line-clamp-2 text-lg font-semibold text-foreground">{meeting.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{meeting.description || "No meeting description"}</p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="rounded-md border border-border/70 bg-background/60 p-2">
              <p className="text-[10px] uppercase tracking-[0.08em]">Files</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{meeting.fileCount}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/60 p-2">
              <p className="text-[10px] uppercase tracking-[0.08em]">Scans</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{meeting.scanCount}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(meeting.createdAt)}</span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-primary">
            <FileText className="h-3.5 w-3.5" />
            Open meeting workspace
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

