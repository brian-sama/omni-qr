import Link from "next/link";
import { ArrowRight, ShieldCheck, QrCode, ChartNoAxesCombined, Sparkles } from "lucide-react";

const steps = [
  {
    title: "Create a secure meeting",
    description: "Spin up a branded meeting room with policy controls in under 60 seconds."
  },
  {
    title: "Upload documents once",
    description: "Distribute updates instantly with versioned files and audit visibility."
  },
  {
    title: "Share one dynamic QR",
    description: "Participants scan and access the latest approved materials in real time."
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-soft">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="font-[var(--font-space-grotesk)] text-lg font-semibold tracking-tight">Scan Suite</p>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Enterprise</p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground transition hover:text-foreground">
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-16 px-6 pb-24 pt-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <section>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Secure Meeting Distribution Infrastructure
          </p>
          <h1 className="font-[var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Enterprise-grade QR document delivery for high-stakes meetings.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Scan Suite gives boards, councils, universities, and institutions one trusted workflow for secure distribution,
            live updates, and full auditability.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground">
              Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-lg border border-border/80 bg-card/80 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Step {index + 1}</p>
                <h3 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative rounded-xl border border-border bg-card/80 p-6 shadow-glass">
          <div className="absolute -right-6 -top-6 hidden h-20 w-20 rounded-full bg-secondary/30 blur-2xl sm:block" />
          <div className="rounded-lg border border-border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Live demo QR</p>
            <div className="mt-4 grid place-items-center rounded-lg border border-border bg-card p-4">
              <div className="relative h-44 w-44 rounded-md border border-border bg-gradient-to-br from-slate-900 to-slate-800 p-4">
                <div className="grid h-full w-full grid-cols-7 gap-1">
                  {Array.from({ length: 49 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={idx % 3 === 0 || idx % 5 === 0 ? "rounded-[2px] bg-white" : "rounded-[2px] bg-transparent"}
                    />
                  ))}
                </div>
                <span className="absolute inset-0 animate-pulse rounded-md border border-primary/50" />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              Zero-trust access controls, JWT session rotation, RBAC.
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChartNoAxesCombined className="h-4 w-4 text-secondary" />
              Live scan analytics and version-aware document timelines.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

