import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  className
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-2", className)}>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

