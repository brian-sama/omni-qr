"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useMutation } from "@tanstack/react-query";
import { Download, LoaderCircle, Settings2 } from "lucide-react";
import { useParams } from "next/navigation";
import { FileList } from "@/components/meeting/file-list";
import { LiveQrPanel } from "@/components/meeting/live-qr-panel";
import { UploadDropzone } from "@/components/meeting/upload-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuth } from "@/hooks/use-auth";
import { useMeeting, useMeetingMutations } from "@/hooks/use-meetings";
import { useRealtimeMeeting } from "@/hooks/use-realtime";
import { apiClient } from "@/lib/api-client";
import { statusBadge } from "@/lib/utils";

export default function MeetingDetailPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params?.meetingId ?? "";
  const meetingQuery = useMeeting(meetingId);
  const authQuery = useAuth();
  const { refreshMeeting, refreshMeetings } = useMeetingMutations(meetingId);

  const [scanCount, setScanCount] = useState(0);
  const [qrTick, setQrTick] = useState(0);
  const [posterOpen, setPosterOpen] = useState(false);

  const patchMeeting = useMutation({
    mutationFn: (payload: {
      accessPolicy?: {
        accessType: "PUBLIC" | "PASSWORD" | "PRIVATE";
        password?: string;
      };
      expiresAt?: string;
      status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
    }) => apiClient.patch(`/api/v1/meetings/${meetingId}`, payload),
    onSuccess: () => {
      refreshMeeting();
      refreshMeetings();
    }
  });

  const handlers = useMemo(
    () => ({
      onScanUpdated: (payload: { meetingId: string; scanCount: number }) => {
        if (payload.meetingId === meetingId) {
          setScanCount(payload.scanCount);
        }
      },
      onFileAdded: (payload: { meetingId: string }) => {
        if (payload.meetingId === meetingId) {
          setQrTick((previous) => previous + 1);
          refreshMeeting();
        }
      },
      onFileVersioned: (payload: { meetingId: string }) => {
        if (payload.meetingId === meetingId) {
          setQrTick((previous) => previous + 1);
          refreshMeeting();
        }
      },
      onMeetingUpdated: (payload: { meetingId: string }) => {
        if (payload.meetingId === meetingId) {
          refreshMeeting();
        }
      }
    }),
    [meetingId, refreshMeeting]
  );

  useRealtimeMeeting(meetingId, handlers);

  useEffect(() => {
    if (meetingQuery.data) {
      setScanCount(meetingQuery.data.scanCount);
    }
  }, [meetingQuery.data]);

  if (!meetingId) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (meetingQuery.isLoading || !meetingQuery.data) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const meeting = meetingQuery.data;
  const canEdit = authQuery.data ? ["OWNER", "ADMIN", "EDITOR"].includes(authQuery.data.user.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading title={meeting.title} subtitle={meeting.description || "No description"} />
        <div className="flex items-center gap-2">
          <Badge className={statusBadge(meeting.status)}>{meeting.status}</Badge>
          <Badge className="border border-border bg-muted text-muted-foreground">{meeting.accessType}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-4">
          {canEdit ? (
            <UploadDropzone
              meetingId={meeting.id}
              onUploaded={() => {
                setQrTick((previous) => previous + 1);
                refreshMeeting();
                refreshMeetings();
              }}
            />
          ) : null}

          <FileList files={meeting.files} />
        </div>

        <div className="space-y-4">
          <LiveQrPanel slug={meeting.slug} updatedTick={qrTick} scanCount={scanCount} />

          {canEdit ? (
            <AccessSettingsCard
              defaultAccessType={meeting.accessPolicy?.accessType ?? meeting.accessType}
              defaultStatus={meeting.status}
              defaultExpiresAt={meeting.expiresAt}
              onSave={(payload) => patchMeeting.mutateAsync(payload)}
              pending={patchMeeting.isPending}
            />
          ) : null}

          <Card className="border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Poster export</p>
                <p className="text-xs text-muted-foreground">Render print-ready A4 meeting poster.</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => setPosterOpen(true)}>
                <Download className="h-4 w-4" />
                Preview poster
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {posterOpen ? (
        <PosterModal
          title={meeting.title}
          slug={meeting.slug}
          onClose={() => setPosterOpen(false)}
          organizationName="omniQR"
        />
      ) : null}
    </div>
  );
}

function AccessSettingsCard({
  defaultAccessType,
  defaultStatus,
  defaultExpiresAt,
  onSave,
  pending
}: {
  defaultAccessType: "PUBLIC" | "PASSWORD" | "PRIVATE";
  defaultStatus: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  defaultExpiresAt?: string | null;
  onSave: (payload: {
    accessPolicy?: {
      accessType: "PUBLIC" | "PASSWORD" | "PRIVATE";
      password?: string;
    };
    expiresAt?: string;
    status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  }) => Promise<unknown>;
  pending: boolean;
}) {
  const [accessType, setAccessType] = useState(defaultAccessType);
  const [status, setStatus] = useState(defaultStatus);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState(
    defaultExpiresAt ? new Date(defaultExpiresAt).toISOString().slice(0, 16) : ""
  );
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card className="border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Access settings</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-muted-foreground">Visibility</label>
          <select
            value={accessType}
            onChange={(event) => setAccessType(event.target.value as "PUBLIC" | "PASSWORD" | "PRIVATE")}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="PUBLIC">Public</option>
            <option value="PASSWORD">Password protected</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        {accessType === "PASSWORD" ? (
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-muted-foreground">Password</label>
            <Input
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-muted-foreground">Meeting state</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED")}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-muted-foreground">Expiry date</label>
          <Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </div>

        <Button
          className="w-full"
          disabled={pending}
          onClick={async () => {
            await onSave({
              status,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
              accessPolicy: {
                accessType,
                password: accessType === "PASSWORD" && password ? password : undefined
              }
            });

            setMessage("Access settings updated.");
            setTimeout(() => setMessage(null), 2000);
          }}
        >
          {pending ? "Saving..." : "Save settings"}
        </Button>

        {message ? <p className="text-xs text-secondary">{message}</p> : null}
      </div>
    </Card>
  );
}

function PosterModal({
  title,
  slug,
  organizationName,
  onClose
}: {
  title: string;
  slug: string;
  organizationName: string;
  onClose: () => void;
}) {
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/f/${slug}`;

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(publicUrl, { width: 1024, margin: 2 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `omniqr-${slug}.png`;
    link.click();
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(publicUrl, { type: "svg", width: 1024, margin: 2 });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `omniqr-${slug}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    const dataUrl = await QRCode.toDataURL(publicUrl, { width: 850, margin: 2 });
    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>omniQR Poster</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 40px; }
            .card { border: 1px solid #dce3ee; border-radius: 18px; padding: 32px; text-align: center; }
            h1 { margin: 0 0 8px; font-size: 26px; }
            p { color: #5f6b85; }
            img { width: 380px; height: 380px; margin: 20px auto; display: block; }
          </style>
        </head>
        <body>
          <section class="card">
            <h1>${title}</h1>
            <p>${organizationName}</p>
            <img src="${dataUrl}" alt="Meeting QR" />
            <p>${publicUrl}</p>
          </section>
          <script>window.print();</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-3xl border-border bg-card p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">A4 Poster Preview</p>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">Print-safe export with dynamic QR link.</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid min-h-[420px] place-items-center rounded-lg border border-border bg-background/60">
          <div className="w-[320px] rounded-lg border border-border bg-card p-5 shadow-glass">
            <p className="text-center text-xs uppercase tracking-[0.1em] text-muted-foreground">Meeting QR</p>
            <h4 className="mt-2 text-center text-base font-semibold text-foreground">{title}</h4>
            <div className="mt-4 flex h-[240px] items-center justify-center rounded-md border border-border text-xs text-muted-foreground">
              Printable QR renders in download output
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={downloadPdf}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={downloadPng}>
            Download PNG
          </Button>
          <Button onClick={downloadSvg}>Download SVG</Button>
        </div>
      </Card>
    </div>
  );
}

