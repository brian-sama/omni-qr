"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, LoaderCircle, Lock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBytes, formatDate } from "@/lib/utils";
import type { PublicMeetingResponse } from "@/types";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function PublicMeetingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [loading, setLoading] = useState(true);
  const [meetingData, setMeetingData] = useState<PublicMeetingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  async function fetchMeeting(currentSlug: string) {
    if (!currentSlug) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/public/meetings/${currentSlug}`, {
        credentials: "include",
        cache: "no-store"
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Meeting unavailable");
        setMeetingData(null);
        return;
      }

      setMeetingData(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load meeting");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMeeting(slug);
  }, [slug]);

  async function verifyPassword(event: FormEvent) {
    event.preventDefault();

    if (!slug) {
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/v1/public/meetings/${slug}/verify`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "Invalid password");
      return;
    }

    setPassword("");
    await fetchMeeting(slug);
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-md border-border bg-card p-6 text-center">
          <p className="text-lg font-semibold text-foreground">Meeting unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (!meetingData) {
    return null;
  }

  if (meetingData.requiresPassword) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-md border-border bg-card p-6">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Password protected meeting</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the access code shared by your administrator.</p>
          </div>

          <form className="space-y-3" onSubmit={verifyPassword}>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Meeting password"
              required
            />
            <Button className="w-full" type="submit">
              Unlock documents
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{meetingData.organization.name}</p>
            <p className="text-xs text-muted-foreground">Meeting document portal</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pt-6 md:px-8">
        <h1 className="text-2xl font-semibold text-foreground">{meetingData.meeting.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{meetingData.meeting.description || "No description"}</p>

        <div className="mt-6 space-y-3">
          {(meetingData.files ?? []).length === 0 ? (
            <Card className="border-border bg-card p-6 text-center text-sm text-muted-foreground">No files available yet.</Card>
          ) : (
            meetingData.files?.map((file) => (
              <Card key={file.id} className="border-border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} | {formatDate(file.updatedAt)}
                    </p>
                  </div>
                  <Button
                    className="h-11 gap-2 px-4"
                    onClick={async () => {
                      const response = await fetch(`${apiBaseUrl}/api/v1/public/files/${file.id}/access-url`, {
                        credentials: "include",
                        cache: "no-store"
                      });

                      const payload = await response.json();

                      if (response.ok) {
                        window.open(payload.url, "_blank", "noopener,noreferrer");
                      } else {
                        setError(payload.error ?? "Unable to open file");
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Open
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
