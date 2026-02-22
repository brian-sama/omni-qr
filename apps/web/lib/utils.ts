import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(input));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[index]}`;
}

export function statusBadge(status: string): string {
  if (status === "ACTIVE") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  }

  if (status === "EXPIRED") {
    return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  }

  if (status === "DRAFT") {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  }

  if (status === "ARCHIVED") {
    return "bg-slate-500/25 text-slate-200 border border-slate-500/40";
  }

  return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
}

