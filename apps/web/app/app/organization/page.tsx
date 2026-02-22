"use client";

import { useEffect, useState } from "react";
import { Building2, Palette, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { useOrganization, useUpdateOrganization } from "@/hooks/use-organization";

export default function OrganizationPage() {
  const organizationQuery = useOrganization();
  const updateOrganization = useUpdateOrganization();

  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1B4DFF");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (organizationQuery.data) {
      setName(organizationQuery.data.organization.name);
      setPrimaryColor(organizationQuery.data.organization.primaryColor ?? "#1B4DFF");
      setLogoUrl(organizationQuery.data.organization.logoUrl ?? "");
    }
  }, [organizationQuery.data]);

  return (
    <div className="space-y-6">
      <SectionHeading title="Organization" subtitle="Branding, identity, and default visual controls." />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            Brand profile
          </div>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await updateOrganization.mutateAsync({
                name,
                primaryColor,
                logoUrl: logoUrl || null
              });
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Organization name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Primary brand color</label>
              <div className="flex items-center gap-2">
                <Input value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} required />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Logo URL</label>
              <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://.../logo.svg" />
              <p className="mt-1 text-xs text-muted-foreground">Upload pipeline can later map this to object storage.</p>
            </div>

            {updateOrganization.isError ? (
              <p className="text-sm text-rose-300">{(updateOrganization.error as Error).message}</p>
            ) : null}

            <Button type="submit" disabled={updateOrganization.isPending}>
              {updateOrganization.isPending ? "Saving..." : "Save branding"}
            </Button>
          </form>
        </Card>

        <Card className="border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Palette className="h-4 w-4 text-primary" />
            Live preview
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-md text-white" style={{ backgroundColor: primaryColor }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Organization logo" className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{name || "Organization name"}</p>
                  <p className="text-xs text-muted-foreground">Branding sample</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-4">
              <button className="h-10 rounded-md px-4 text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
                Primary action
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

