"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateMeeting } from "@/hooks/use-meetings";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateMeetingModal({ open, onClose }: Props) {
  const createMeeting = useCreateMeeting();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [accessType, setAccessType] = useState<"PUBLIC" | "PASSWORD" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-xl border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Create meeting</h3>
            <p className="text-sm text-muted-foreground">Generate a secure live QR distribution room.</p>
          </div>
          <Button variant="ghost" className="w-9 px-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await createMeeting.mutateAsync({
              title,
              description,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
              accessPolicy: {
                accessType,
                password: accessType === "PASSWORD" ? password : undefined
              }
            });
            setTitle("");
            setDescription("");
            setExpiresAt("");
            setPassword("");
            setAccessType("PUBLIC");
            onClose();
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Meeting title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Board Q2 Governance Review" required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agenda notes, legal packet summary, distribution notes"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Access mode</label>
              <select
                value={accessType}
                onChange={(e) => setAccessType(e.target.value as "PUBLIC" | "PASSWORD" | "PRIVATE")}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
              >
                <option value="PUBLIC">Public</option>
                <option value="PASSWORD">Password</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Expires at (optional)</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>

          {accessType === "PASSWORD" ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Meeting password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </div>
          ) : null}

          {createMeeting.isError ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-foreground">
              {(createMeeting.error as Error).message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? "Creating..." : "Create meeting"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

