"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Palette, QrCode, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const layoutOptions = [
  { id: "clean", label: "Clean" },
  { id: "framed", label: "Framed" },
  { id: "minimal", label: "Minimal" }
] as const;

export function LiveQrPanel({
  slug,
  updatedTick,
  scanCount
}: {
  slug: string;
  updatedTick: number;
  scanCount: number;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isCustomizerOpen, setCustomizerOpen] = useState(false);

  const [darkColor, setDarkColor] = useState("#f8fafc");
  const [lightColor, setLightColor] = useState("#0b1222");
  const [footerText, setFooterText] = useState("Scan for live documents");
  const [embedLogo, setEmbedLogo] = useState(true);
  const [layoutStyle, setLayoutStyle] = useState<(typeof layoutOptions)[number]["id"]>("clean");

  const publicUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${baseUrl}/f/${slug}`;
  }, [slug]);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 360,
      margin: layoutStyle === "minimal" ? 0 : 1,
      color: {
        dark: darkColor,
        light: lightColor
      }
    })
      .then((value: string) => setQrDataUrl(value))
      .catch(() => setQrDataUrl(null));
  }, [publicUrl, updatedTick, darkColor, lightColor, layoutStyle]);

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="border-b border-border/80 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Live QR Access</h3>
          <Badge className="border border-primary/40 bg-primary/20 text-primary-foreground">Scans {scanCount}</Badge>
        </div>
      </div>

      <div className="p-5 text-center">
        <div
          className={cn(
            "relative mx-auto w-fit rounded-xl border border-border bg-background/40 p-3",
            layoutStyle === "framed" && "border-primary/50 shadow-glass",
            layoutStyle === "minimal" && "border-transparent bg-transparent p-1"
          )}
        >
          {updatedTick > 0 ? <span className="absolute inset-0 animate-pulseRing rounded-xl border border-primary/60" /> : null}
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Meeting QR code" className="h-48 w-48" />
          ) : (
            <div className="grid h-48 w-48 place-items-center text-xs text-muted-foreground">Generating QR...</div>
          )}

          {embedLogo ? (
            <div className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-primary">
              <QrCode className="h-4 w-4" />
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">{footerText}</p>

        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setCustomizerOpen((prev) => !prev)}>
            <SlidersHorizontal className="h-4 w-4" />
            {isCustomizerOpen ? "Hide" : "Customize QR"}
          </Button>
        </div>

        {isCustomizerOpen ? (
          <div className="mt-4 space-y-3 rounded-md border border-border bg-background/60 p-4 text-left">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-muted-foreground">Primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={darkColor}
                    onChange={(event) => setDarkColor(event.target.value)}
                    className="h-10 w-10 rounded border border-border"
                  />
                  <input
                    value={darkColor}
                    onChange={(event) => setDarkColor(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-muted-foreground">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lightColor}
                    onChange={(event) => setLightColor(event.target.value)}
                    className="h-10 w-10 rounded border border-border"
                  />
                  <input
                    value={lightColor}
                    onChange={(event) => setLightColor(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-muted-foreground">Footer text</label>
              <input
                value={footerText}
                onChange={(event) => setFooterText(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                maxLength={60}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEmbedLogo((current) => !current)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-medium",
                  embedLogo ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {embedLogo ? "Logo embedded" : "Logo hidden"}
              </button>

              <div className="grid grid-cols-3 gap-1 rounded-md border border-border p-1">
                {layoutOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLayoutStyle(option.id)}
                    className={cn(
                      "rounded px-2 py-1 text-[11px]",
                      layoutStyle === option.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

