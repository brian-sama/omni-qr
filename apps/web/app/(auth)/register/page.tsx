"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/use-auth";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card className="border-border bg-card p-6 shadow-glass">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
          <QrCode className="h-6 w-6" />
        </div>
        <h1 className="font-[var(--font-space-grotesk)] text-2xl font-semibold text-foreground">Start your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create your account. Organization is auto-provisioned.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await register.mutateAsync({ name, email, password });
          router.replace("/app/onboarding");
        }}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Full name</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Work email</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={12}
            required
          />
          <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>
        </div>

        {register.isError ? <p className="text-sm text-rose-300">{(register.error as Error).message}</p> : null}

        <Button className="w-full" type="submit" disabled={register.isPending}>
          {register.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have access?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

