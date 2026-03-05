import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://scansuite.co.zw";

    // In a real app, you might fetch dynamic routes (e.g., public meeting pages) here
    const routes = [
        "",
        "/login",
        "/register",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    return [...routes];
}
