"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { useCreateMeeting, useMeetings } from "@/hooks/use-meetings";
import { useOrganization, useUpdateOrganization } from "@/hooks/use-organization";
import { ApiError } from "@/lib/api-client";

function combineDateAndTime(date: string, time: string): string | undefined {
  if (!date || !time) {
    return undefined;
  }

  return new Date(`${date}T${time}:00`).toISOString();
}

export default function OnboardingPage() {
  const router = useRouter();
  const meetingStepRef = useRef<HTMLDivElement | null>(null);
  const organizationQuery = useOrganization();
  const meetingsQuery = useMeetings();
  const updateOrganization = useUpdateOrganization();
  const createMeeting = useCreateMeeting();

  const [organizationName, setOrganizationName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1B4DFF");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingExpiryDate, setMeetingExpiryDate] = useState("");
  const [meetingExpiryTime, setMeetingExpiryTime] = useState("");
  const [accessType, setAccessType] = useState<"PUBLIC" | "PASSWORD" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");
  const [meetingError, setMeetingError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationQuery.data?.organization) {
      setOrganizationName(organizationQuery.data.organization.name);
      setPrimaryColor(organizationQuery.data.organization.primaryColor ?? "#1B4DFF");
      setLogoUrl(organizationQuery.data.organization.logoUrl ?? "");
    }
  }, [organizationQuery.data]);

  const hasMeeting = (meetingsQuery.data?.length ?? 0) > 0;
  const isBrandingCompleted =
    Boolean(organizationQuery.data?.organization.logoUrl) ||
    Boolean(organizationQuery.data?.organization.name && !organizationQuery.data.organization.name.endsWith("'s Organization"));

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Guided onboarding"
        subtitle="Set branding and create your first meeting to unlock the full Scan Suite workspace."
      />

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Step 2: Organization profile
          </div>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();

              setBrandingError(null);
              setBrandingSuccess(null);

              try {
                await updateOrganization.mutateAsync({
                  name: organizationName,
                  primaryColor,
                  logoUrl: logoUrl.trim() || null
                });

                setBrandingSuccess("Organization profile saved. Continue below to create your first meeting.");
                meetingStepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              } catch (error) {
                if (error instanceof ApiError) {
                  setBrandingError(error.message);
                  return;
                }

                setBrandingError("Unable to save organization profile right now.");
              }
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Organization name</label>
              <Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Primary color</label>
              <div className="flex items-center gap-2">
                <Input value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} required />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  className="h-10 w-14 rounded-md border border-border"
                  title="Choose organization primary color"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Logo URL</label>
              <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://.../logo.svg" />
            </div>

            {brandingError ? <p className="text-sm text-danger">{brandingError}</p> : null}
            {brandingSuccess ? <p className="text-sm text-secondary">{brandingSuccess}</p> : null}

            <Button type="submit" disabled={updateOrganization.isPending}>
              {updateOrganization.isPending ? "Saving..." : "Save and continue"}
            </Button>
          </form>
        </Card>

        <Card className="border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Onboarding progress</p>
          <ProgressItem complete={true} label="Account created" />
          <ProgressItem complete={isBrandingCompleted} label="Organization branded" />
          <ProgressItem complete={hasMeeting} label="First meeting created" />
        </Card>
      </div>

      <div ref={meetingStepRef}>
        <Card className="border-border bg-card p-5">
          <div className="mb-4 text-sm font-semibold text-foreground">Step 3: Create your first meeting</div>

          <form
            className="grid gap-4 lg:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();

              setMeetingError(null);

              const startsAt = combineDateAndTime(meetingDate, meetingTime);
              const expiresAt =
                meetingExpiryDate && meetingExpiryTime
                  ? combineDateAndTime(meetingExpiryDate, meetingExpiryTime)
                  : undefined;

              if (!startsAt) {
                setMeetingError("Choose both a meeting date and a meeting time.");
                return;
              }

              try {
                const result = await createMeeting.mutateAsync({
                  title: meetingTitle,
                  description: `First meeting created during onboarding for ${organizationName}`,
                  startsAt,
                  expiresAt,
                  accessPolicy: {
                    accessType,
                    password: accessType === "PASSWORD" ? password : undefined
                  }
                });

                router.replace(`/app/meetings/${result.meeting.id}`);
              } catch (error) {
                if (error instanceof ApiError) {
                  setMeetingError(error.message);
                  return;
                }

                setMeetingError("Unable to create the meeting right now.");
              }
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Meeting title</label>
                <Input
                  value={meetingTitle}
                  onChange={(event) => setMeetingTitle(event.target.value)}
                  placeholder="Board Strategy Session"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Date and Time</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(event) => setMeetingTime(event.target.value)}
                    step="60"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Optional expiry</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="date"
                    value={meetingExpiryDate}
                    onChange={(event) => setMeetingExpiryDate(event.target.value)}
                  />
                  <Input
                    type="time"
                    value={meetingExpiryTime}
                    onChange={(event) => setMeetingExpiryTime(event.target.value)}
                    step="60"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Access type</label>
                <select
                  value={accessType}
                  onChange={(event) => setAccessType(event.target.value as "PUBLIC" | "PASSWORD" | "PRIVATE")}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  title="Select meeting access type"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PASSWORD">Password protected</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              {accessType === "PASSWORD" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Meeting password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
              ) : null}

              <div className="pt-1">
                <Button type="submit" disabled={createMeeting.isPending}>
                  {createMeeting.isPending ? "Creating..." : "Create first meeting"}
                </Button>
              </div>

              {meetingError ? <p className="text-sm text-danger">{meetingError}</p> : null}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function ProgressItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm">
      {complete ? <CheckCircle2 className="h-4 w-4 text-secondary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
      <span className={complete ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

