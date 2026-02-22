"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/providers/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { useMeetings } from "@/hooks/use-meetings";
import { useOrganization } from "@/hooks/use-organization";

function useOnboardingRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const authQuery = useAuth();

  const organizationQuery = useOrganization(Boolean(authQuery.data));
  const meetingsQuery = useMeetings(Boolean(authQuery.data));

  useEffect(() => {
    if (!authQuery.data || !organizationQuery.data || !meetingsQuery.data) {
      return;
    }

    const isOnboardingRoute = pathname.startsWith("/app/onboarding");

    const organizationName = organizationQuery.data.organization.name;
    const hasBranding = Boolean(
      organizationQuery.data.organization.logoUrl || !organizationName.endsWith("'s Organization")
    );

    const hasMeeting = meetingsQuery.data.length > 0;
    const needsOnboarding = !hasBranding || !hasMeeting;

    if (needsOnboarding && !isOnboardingRoute) {
      router.replace("/app/onboarding");
      return;
    }

    if (!needsOnboarding && isOnboardingRoute) {
      router.replace("/app/dashboard");
    }
  }, [authQuery.data, meetingsQuery.data, organizationQuery.data, pathname, router]);
}

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  useOnboardingRedirect();

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

