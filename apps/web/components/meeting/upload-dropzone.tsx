"use client";

import { useCallback, useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

async function sha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function uploadWithProgress(url: string, file: File, onProgress: (value: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${request.status}`));
      }
    };

    request.onerror = () => reject(new Error("Network error during upload"));
    request.send(file);
  });
}

export function UploadDropzone({
  meetingId,
  onUploaded
}: {
  meetingId: string;
  onUploaded: () => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      setError(null);
      setProgress(0);
      setActiveFileName(file.name);

      try {
        const digest = await sha256(file);

        const presign = await apiClient.post<{
          fileId: string;
          versionId: string;
          upload: { url: string };
        }>("/api/v1/files/presign-upload", {
          meetingId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          sha256: digest
        });

        await uploadWithProgress(presign.upload.url, file, setProgress);

        await apiClient.post(`/api/v1/files/${presign.fileId}/complete`, {
          versionId: presign.versionId,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          sha256: digest
        });

        setProgress(100);
        onUploaded();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      } finally {
        setTimeout(() => {
          setProgress(null);
          setActiveFileName(null);
        }, 1200);
      }
    },
    [meetingId, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: 1,
    noClick: true
  });

  const progressLabel = useMemo(() => {
    if (progress === null || !activeFileName) {
      return null;
    }

    return `${activeFileName} (${progress}%)`;
  }, [activeFileName, progress]);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted/20 p-4 transition-all",
        isDragActive && "border-primary/70 bg-primary/10"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Drag and drop files here</p>
          <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX or images up to 20MB per file.</p>
          {progressLabel ? <p className="text-xs text-primary">{progressLabel}</p> : null}
          {activeFileName && progress !== null ? (
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
        </div>
        <Button variant="outline" className="gap-2" onClick={open}>
          <UploadCloud className="h-4 w-4" />
          Browse files
        </Button>
      </div>
    </div>
  );
}

