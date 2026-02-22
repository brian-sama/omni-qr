export type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export type User = {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
};

export type Organization = {
  id: string;
  name: string;
  primaryColor: string;
  logoUrl?: string | null;
};

export type AuthResponse = {
  user: User;
  organization: Organization;
};

export type MeetingSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  accessType: "PUBLIC" | "PASSWORD" | "PRIVATE";
  createdAt: string;
  expiresAt?: string | null;
  fileCount: number;
  scanCount: number;
};

export type MeetingFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  latestVersion: {
    id: string;
    version: number;
    status: "PENDING" | "READY" | "FAILED";
    createdAt: string;
  } | null;
};

export type MeetingDetail = MeetingSummary & {
  accessPolicy: {
    accessType: "PUBLIC" | "PASSWORD" | "PRIVATE";
    accessStartsAt?: string | null;
    accessEndsAt?: string | null;
    oneTimeAccess: boolean;
    viewOnly: boolean;
  } | null;
  files: MeetingFile[];
};

export type PublicMeetingResponse = {
  meeting: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    accessType: "PUBLIC" | "PASSWORD" | "PRIVATE";
    expiresAt?: string | null;
  };
  organization: {
    id: string;
    name: string;
    primaryColor: string;
    logoUrl?: string | null;
  };
  requiresPassword?: boolean;
  scanCount?: number;
  files?: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

