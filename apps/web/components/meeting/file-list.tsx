"use client";

import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { formatBytes, formatDate } from "@/lib/utils";
import type { MeetingFile } from "@/types";

export function FileList({ files }: { files: MeetingFile[] }) {
  return (
    <Card className="border-border bg-card">
      <div className="border-b border-border/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Meeting documents</h3>
      </div>

      <div className="divide-y divide-border/70">
        {files.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} | Updated {formatDate(file.updatedAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline-flex">v{file.latestVersion?.version ?? 1}</span>
                <Button
                  variant="outline"
                  className="h-9 w-9 px-0"
                  onClick={async () => {
                    const result = await apiClient.get<{ url: string }>(`/api/v1/files/${file.id}/access-url`);
                    window.open(result.url, "_blank", "noopener,noreferrer");
                  }}
                  aria-label={`Download ${file.name}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

