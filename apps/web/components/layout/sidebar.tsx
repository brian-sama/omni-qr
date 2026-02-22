"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  Cog,
  LayoutDashboard,
  QrCode,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/meetings", label: "Meetings", icon: QrCode },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/organization", label: "Organization", icon: Building2 },
  { href: "/app/settings", label: "Settings", icon: Cog }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 border-r border-border/80 bg-card/70 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft">
            <QrCode className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
              Pro
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">omniQR</p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Enterprise</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="activeSidebar"
                  className="absolute inset-0 rounded-md border border-border bg-muted/80"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}
              <Icon className={cn("relative z-10 h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-6 py-6">
        <div className="rounded-lg border border-border bg-background/60 p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Platform Status
          </div>
          <p className="text-sm text-foreground">Realtime distribution active</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            99.99% uptime target
          </p>
        </div>
      </div>
    </aside>
  );
}

