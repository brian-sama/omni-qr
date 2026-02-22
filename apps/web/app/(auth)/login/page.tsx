"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/app/dashboard");

  useEffect(() => {
    const url = new URL(window.location.href);
    const next = url.searchParams.get("next");
    if (next) {
      setNextPath(next);
    }
  }, []);

  return (
    <Card className="border-border bg-card p-6 shadow-glass">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
          <QrCode className="h-6 w-6" />
        </div>
        <h1 className="font-[var(--font-space-grotesk)] text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your omniQR enterprise workspace.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await login.mutateAsync({ email, password });
          router.replace(nextPath);
        }}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Password</label>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>

        {login.isError ? <p className="text-sm text-rose-300">{(login.error as Error).message}</p> : null}

        <Button className="w-full" type="submit" disabled={login.isPending}>
          {login.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        New organization?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Start free
        </Link>
      </p>
    </Card>
  );
}

