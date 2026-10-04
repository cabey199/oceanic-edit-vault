import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  Cat,
  Check,
  Download,
  Expand,
  Heart,
  LockKeyhole,
  Play,
  Upload,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { CinematicPlayer, DeveloperDashboard, UploadDrawer, type ArchiveEdit } from "@/components/archive-experiences";
import coastalMemory from "@/assets/coastal-memory.jpg";
import neonAfterglow from "@/assets/neon-afterglow.jpg";
import tidalStudy from "@/assets/tidal-study.jpg";
import underwaterDream from "@/assets/underwater-dream.jpg";

type Category = "All Edits" | "TikTok / Reels" | "Landscape" | "Favorites";

const edits: ArchiveEdit[] = [
  { id: 1, title: "Submerged in You", note: "Final color grade", image: underwaterDream, size: "84.2 MB", date: "SEP 28, 2026", duration: "00:24", format: "16:9", favorite: true },
  { id: 2, title: "Neon Afterglow", note: "Reel master", image: neonAfterglow, size: "12.4 MB", date: "SEP 22, 2026", duration: "00:15", format: "9:16", favorite: true },
  { id: 3, title: "Where We Left It", note: "Director’s cut", image: coastalMemory, size: "146.8 MB", date: "SEP 16, 2026", duration: "01:08", format: "16:9", favorite: false },
  { id: 4, title: "Tidal Study No. 04", note: "Texture loop", image: tidalStudy, size: "31.7 MB", date: "SEP 08, 2026", duration: "00:32", format: "9:16", favorite: false },
  { id: 5, title: "Cerulean Silence", note: "Archive master", image: underwaterDream, size: "92.5 MB", date: "AUG 30, 2026", duration: "00:48", format: "9:16", favorite: true },
  { id: 6, title: "Midnight Passenger", note: "Campaign cut", image: neonAfterglow, size: "67.1 MB", date: "AUG 19, 2026", duration: "00:41", format: "16:9", favorite: false },
];

const filters: Category[] = ["All Edits", "TikTok / Reels", "Landscape", "Favorites"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oceanic Edits Archive — Private Digital Vault" },
      { name: "description", content: "A private, beautifully curated archive for raw and finished video edits." },
      { property: "og:title", content: "Oceanic Edits Archive" },
      { property: "og:description", content: "A private digital vault for cinematic edits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const reduceMotion = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<Category>("All Edits");
  const [selected, setSelected] = useState<ArchiveEdit | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [developerVault, setDeveloperVault] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleEdits = useMemo(() => edits.filter((edit) => {
    if (activeFilter === "Favorites") return edit.favorite;
    if (activeFilter === "TikTok / Reels") return edit.format === "9:16";
    if (activeFilter === "Landscape") return edit.format === "16:9";
    return true;
  }), [activeFilter]);

  const flashNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-8 sm:pt-6">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between border border-border/70 bg-background/55 px-4 backdrop-blur-xl sm:px-6">
          <a href="#top" className="flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground sm:text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" />
            </span>
            HERNAME.ARCHIVE
          </a>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(true)} className="h-10 border-primary/40 bg-primary/5 px-3 text-[11px] uppercase tracking-[0.16em] text-primary hover:border-primary hover:bg-primary/10 hover:text-primary sm:px-5">
              <Upload className="size-3.5" /> <span className="hidden sm:inline">Upload new edit</span><span className="sm:hidden">Upload</span>
            </Button>
            <Button aria-label="Private vault locked" title="Private vault locked" variant="ghost" size="icon" className="text-muted-foreground hover:bg-primary/10 hover:text-primary">
              <LockKeyhole className="size-4" />
            </Button>
          </div>
        </nav>
      </header>

      <section id="top" className="relative flex min-h-[94svh] items-center justify-center px-5 pb-12 pt-28">
        <motion.img
          src={tidalStudy}
          alt="Moonlit ocean waves"
          width={1440}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          initial={reduceMotion ? false : { scale: 1.08 }}
          animate={reduceMotion ? false : { scale: 1 }}
          transition={{ duration: 3.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--hero-overlay-soft),var(--hero-overlay)_72%,var(--background))]" />
        <div className="ocean-light absolute inset-0" />
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25 }} className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex border border-primary/35 bg-background/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-primary backdrop-blur-md sm:text-xs">
            [ Private digital vault ]
          </div>
          <h1 className="font-display text-5xl leading-[0.98] text-foreground sm:text-7xl lg:text-8xl">
            An aesthetic space<br /><em className="text-primary">for every edit.</em>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Unlimited storage, instant downloads, crafted for your raw &amp; finished edits.
          </p>
          <Button size="lg" onClick={() => document.querySelector("#vault")?.scrollIntoView({ behavior: "smooth" })} className="mt-10 h-12 bg-primary px-7 text-[11px] uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_32px_var(--primary-glow)] hover:bg-primary/90">
            Explore vault <ArrowDown className="size-4" />
          </Button>
        </motion.div>
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Scroll to descend</div>
      </section>

      <section id="vault" className="relative px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 border-b border-border pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Archive / 2026</p>
              <h2 className="font-display text-4xl sm:text-5xl">The main vault</h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">06 edits · 434.7 MB</p>
          </div>

          <div className="no-scrollbar my-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter edits">
            {filters.map((filter) => (
              <Button key={filter} role="tab" aria-selected={activeFilter === filter} variant="ghost" onClick={() => setActiveFilter(filter)} className={`shrink-0 rounded-full border px-4 font-mono text-[10px] uppercase tracking-[0.12em] ${activeFilter === filter ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"}`}>
                {filter}
              </Button>
            ))}
          </div>

          <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visibleEdits.map((edit, index) => (
                <motion.article layout key={edit.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: index * 0.045 }} className="group overflow-hidden border border-border bg-card/60 backdrop-blur-lg">
                  <div className={`relative overflow-hidden bg-secondary ${edit.format === "9:16" ? "aspect-[4/5]" : "aspect-[16/10]"}`}>
                    <img src={edit.image} alt={`${edit.title} video thumbnail`} loading="lazy" width={1440} height={900} className="h-full w-full object-cover opacity-85 transition duration-700 ease-out group-hover:scale-105 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--card),transparent_55%)] opacity-70" />
                    <div className="absolute left-4 top-4 border border-border bg-background/55 px-2.5 py-1 font-mono text-[9px] tracking-[0.15em] text-foreground backdrop-blur-md">{edit.format}</div>
                    <div className="absolute right-4 top-4 flex gap-2">
                      {edit.favorite && <Heart className="size-4 fill-primary text-primary" aria-label="Favorite" />}
                      <span className="font-mono text-[10px] text-foreground">{edit.duration}</span>
                    </div>
                    <Button aria-label={`Play ${edit.title}`} onClick={() => setSelected(edit)} size="icon" className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60 bg-background/45 text-primary opacity-100 backdrop-blur-md transition hover:scale-110 hover:bg-primary hover:text-primary-foreground sm:opacity-0 sm:group-hover:opacity-100">
                      <Play className="ml-0.5 size-4 fill-current" />
                    </Button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div><h3 className="font-display text-2xl">{edit.title}</h3><p className="mt-1 text-xs text-muted-foreground">{edit.note}</p></div>
                      <span className="shrink-0 border border-border px-2 py-1 font-mono text-[9px] text-muted-foreground">{edit.size}</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <span className="font-mono text-[9px] tracking-[0.13em] text-muted-foreground">{edit.date}</span>
                      <div className="flex gap-1">
                        <Button title="Watch fullscreen" aria-label={`Watch ${edit.title} fullscreen`} variant="ghost" size="icon" onClick={() => setSelected(edit)} className="text-muted-foreground hover:bg-primary/10 hover:text-primary"><Expand /></Button>
                        <Button title="Download MP4" aria-label={`Download ${edit.title}`} variant="ghost" size="icon" onClick={() => flashNotice(`${edit.title} download queued`)} className="text-muted-foreground hover:bg-primary/10 hover:text-primary"><Download /></Button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Private collection · Forever yours</p>
          <div className="relative">
            <Button title="A small secret" aria-label="Open developer vault" variant="ghost" size="icon" onClick={() => setDeveloperVault((value) => !value)} className="group relative opacity-30 hover:bg-transparent hover:text-primary hover:opacity-100">
              {developerVault && <span className="absolute inset-0 animate-ping rounded-full border border-primary" />}<Cat className="size-4" />
            </Button>
          </div>
        </div>
      </footer>

      <UploadDrawer open={uploadOpen} onClose={() => setUploadOpen(false)} onComplete={flashNotice} />
      <AnimatePresence>{developerVault && <DeveloperDashboard embedded onClose={() => setDeveloperVault(false)} />}</AnimatePresence>
      <CinematicPlayer edit={selected} onClose={() => setSelected(null)} onSave={(title) => flashNotice(`${title} is ready for your Camera Roll`)} />

      <AnimatePresence>{notice && <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 border border-primary/30 bg-card/95 px-4 py-3 text-xs text-foreground shadow-[0_0_30px_var(--primary-glow)] backdrop-blur-xl"><Check className="size-4 text-primary" />{notice}</motion.div>}</AnimatePresence>
    </main>
  );
}