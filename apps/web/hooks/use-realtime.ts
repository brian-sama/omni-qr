"use client";

import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const socketBaseUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

type MeetingEventHandlers = {
  onScanUpdated?: (payload: { meetingId: string; scanCount: number }) => void;
  onFileAdded?: (payload: { meetingId: string; fileId: string; version: number }) => void;
  onFileVersioned?: (payload: { meetingId: string; fileId: string; version: number }) => void;
  onMeetingUpdated?: (payload: { meetingId: string; reason: string }) => void;
};

export function useRealtimeMeeting(meetingId: string, handlers: MeetingEventHandlers) {
  const socket = useMemo(
    () =>
      io(`${socketBaseUrl}/ws`, {
        withCredentials: true,
        transports: ["websocket", "polling"]
      }),
    []
  );

  useEffect(() => {
    if (!meetingId) {
      return;
    }

    socket.emit("meeting.join", meetingId);

    if (handlers.onScanUpdated) {
      socket.on("scan.updated", handlers.onScanUpdated);
    }

    if (handlers.onFileAdded) {
      socket.on("file.added", handlers.onFileAdded);
    }

    if (handlers.onFileVersioned) {
      socket.on("file.versioned", handlers.onFileVersioned);
    }

    if (handlers.onMeetingUpdated) {
      socket.on("meeting.updated", handlers.onMeetingUpdated);
    }

    return () => {
      socket.emit("meeting.leave", meetingId);
      socket.off("scan.updated", handlers.onScanUpdated);
      socket.off("file.added", handlers.onFileAdded);
      socket.off("file.versioned", handlers.onFileVersioned);
      socket.off("meeting.updated", handlers.onMeetingUpdated);
    };
  }, [meetingId, handlers, socket]);
}

