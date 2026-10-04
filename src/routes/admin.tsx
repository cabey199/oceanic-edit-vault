import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { DeveloperDashboard } from "@/components/archive-experiences";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Developer Vault — Oceanic Edits Archive" },
    { name: "description", content: "Private storage analytics and video optimization controls for Oceanic Edits Archive." },
    { property: "og:title", content: "Developer Vault — Oceanic Edits Archive" },
    { property: "og:description", content: "Private archive health, storage, and compression controls." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  return <div className="relative"><div className="absolute left-5 top-5 z-10 flex items-center gap-3 sm:left-8 sm:top-8"><Button asChild variant="ghost"><Link to="/"><ArrowLeft /> Archive</Link></Button><LockKeyhole className="size-4 text-primary" /></div><DeveloperDashboard /></div>;
}