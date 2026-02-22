"use client";

import { useMemo } from "react";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/use-auth";

export function Topbar() {
  const { data } = useAuth();
  const { theme, setTheme } = useTheme();
  const logoutMutation = useLogout();
  const router = useRouter();

  const isDark = useMemo(() => theme !== "light", [theme]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 px-5 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h2 className="text-lg font-semibold text-foreground">{data?.organization.name ?? "Organization"}</h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="w-10 px-0"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            className="gap-2"
            disabled={logoutMutation.isPending}
            onClick={async () => {
              await logoutMutation.mutateAsync();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

