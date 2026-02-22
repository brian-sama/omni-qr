"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const authQuery = useAuth();

  useEffect(() => {
    if (authQuery.isLoading) {
      return;
    }

    if (authQuery.isError || !authQuery.data) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [authQuery.isError, authQuery.isLoading, authQuery.data, pathname, router]);

  if (authQuery.isLoading || authQuery.isError || !authQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

