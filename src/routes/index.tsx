import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import {
  ArrowDown,
  Cat,
  Check,
  Download,
  Heart,
  LockKeyhole,
  MoreHorizontal,
  Moon,
  Play,
  RefreshCw,
  Share2,
  Sun,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { AccountPanel } from "@/components/account-panel";
import {
  CinematicPlayer,
  DeveloperDashboard,
  UploadDrawer,
  type ArchiveEdit,
} from "@/components/archive-experiences";
import { OceanCanvas } from "@/components/ocean-canvas";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { supabase } from "@/lib/supabase";
import coastalMemory from "@/assets/coastal-memory.jpg";
import neonAfterglow from "@/assets/neon-afterglow.jpg";
import tidalStudy from "@/assets/tidal-study.jpg";
import underwaterDream from "@/assets/underwater-dream.jpg";

type Category =
  | "All Edits"
  | "TikTok / Reels"
  | "Landscape"
  | "Favorites"
  | "General Vault"
  | "CapCut"
  | "Raw Videos"
  | "Personal Videos";
type OceanTheme = "calm" | "night";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function PrivateThumbnail({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const isPrivateMedia = src.includes("/api/archive-items/");
  const [source, setSource] = useState<string | null>(isPrivateMedia ? null : src);
  useEffect(() => {
    if (!isPrivateMedia) return;
    let active = true;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const url = new URL(src, window.location.origin);
      url.searchParams.set("access_token", session.access_token);
      if (active) setSource(url.toString());
    })();
    return () => {
      active = false;
    };
  }, [isPrivateMedia, src]);
  return source ? (
    <img src={source} alt={alt} className={className} />
  ) : (
    <div aria-label={alt} role="img" className={`${className ?? ""} animate-pulse bg-primary/5`} />
  );
}

function PrivateVideoPreview({
  src,
  poster,
  title,
}: {
  src: string;
  poster: string;
  title: string;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  useEffect(() => {
    if (!hovering) return;
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session) return;
      const url = new URL(src, window.location.origin);
      url.searchParams.set("access_token", session.access_token);
      setSource(url.toString());
    });
    return () => {
      active = false;
    };
  }, [hovering, src]);
  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-hidden="true"
    >
      {source && hovering && (
        <video
          src={source}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={`${title} preview`}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          autoPlay
          onTimeUpdate={(event) => {
            if (event.currentTarget.currentTime >= 3) event.currentTarget.currentTime = 0;
          }}
        />
      )}
    </div>
  );
}

async function createThumbnail(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.src = url;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("The compressed video thumbnail could not be created."));
  });
  video.currentTime = Math.min(1, Math.max(0, video.duration / 10));
  await new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("The compressed video thumbnail could not be created."));
  });
  const canvas = document.createElement("canvas");
  const maxWidth = 900;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
  const thumbnail = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Thumbnail creation failed."))),
      "image/jpeg",
      0.86,
    ),
  );
  URL.revokeObjectURL(url);
  return {
    file: new File([thumbnail], `${name.replace(/\.[^/.]+$/, "")}.jpg`, { type: "image/jpeg" }),
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
  };
}

const edits: ArchiveEdit[] = [
  {
    id: 1,
    title: "Submerged in You",
    note: "Final color grade",
    image: underwaterDream,
    size: "84.2 MB",
    date: "SEP 28, 2026",
    duration: "00:24",
    format: "16:9",
    favorite: true,
  },
  {
    id: 2,
    title: "Neon Afterglow",
    note: "Reel master",
    image: neonAfterglow,
    size: "12.4 MB",
    date: "SEP 22, 2026",
    duration: "00:15",
    format: "9:16",
    favorite: true,
  },
  {
    id: 3,
    title: "Where We Left It",
    note: "Director’s cut",
    image: coastalMemory,
    size: "146.8 MB",
    date: "SEP 16, 2026",
    duration: "01:08",
    format: "16:9",
    favorite: false,
  },
  {
    id: 4,
    title: "Tidal Study No. 04",
    note: "Texture loop",
    image: tidalStudy,
    size: "31.7 MB",
    date: "SEP 08, 2026",
    duration: "00:32",
    format: "9:16",
    favorite: false,
  },
  {
    id: 5,
    title: "Cerulean Silence",
    note: "Archive master",
    image: underwaterDream,
    size: "92.5 MB",
    date: "AUG 30, 2026",
    duration: "00:48",
    format: "9:16",
    favorite: true,
  },
  {
    id: 6,
    title: "Midnight Passenger",
    note: "Campaign cut",
    image: neonAfterglow,
    size: "67.1 MB",
    date: "AUG 19, 2026",
    duration: "00:41",
    format: "16:9",
    favorite: false,
  },
];

const filters: Category[] = ["All Edits", "TikTok / Reels", "Landscape", "Favorites"];

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Allow Supabase to parse access tokens on page mount before redirecting
    if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/login",
      });
    }
  },
  head: () => ({
    meta: [
      { title: "chico’s POV — Oceanic Edits Archive" },
      {
        name: "description",
        content: "A personal ocean of memories, edits, and moments through Chico’s point of view.",
      },
      { property: "og:title", content: "chico’s POV" },
      {
        property: "og:description",
        content: "A personal ocean of memories, edits, and moments through Chico’s point of view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<Category>("All Edits");
  const [archiveEdits, setArchiveEdits] = useState<ArchiveEdit[]>(edits);
  const [selected, setSelected] = useState<ArchiveEdit | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [developerVault, setDeveloperVault] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<"loading" | "ready" | "error">("loading");
  const [theme, setTheme] = useState<OceanTheme>("calm");
  const [sectionFilters, setSectionFilters] = useState<string[]>([]);
  const [moreOpen, setMoreOpen] = useState<string | number | null>(null);
  const { scrollY } = useScroll();
  const lenis = useSmoothScroll();
  const surfaceTide = useMotionValue(0);

  // Handle invite links and magic link hash parameters cleanly
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      if (event === "SIGNED_OUT") {
        void navigate({ to: "/login", replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const surfaceFrame = useRef<number | null>(null);
  useEffect(() => {
    const lowPower = reduceMotion || window.matchMedia("(pointer: coarse)").matches;
    let lastFrame = 0;
    const startedAt = performance.now();
    const render = (time: number) => {
      if (lowPower && time - lastFrame < 42) {
        surfaceFrame.current = window.requestAnimationFrame(render);
        return;
      }
      lastFrame = time;
      const scrollSwell = Math.sin(scrollY.get() * 0.0022) * (theme === "night" ? 11 : 7);
      const surfaceSway =
        Math.sin((time - startedAt) * (theme === "night" ? 0.0009 : 0.00038)) *
        (theme === "night" ? 3.5 : 2);
      surfaceTide.set(scrollSwell + surfaceSway);
      surfaceFrame.current = window.requestAnimationFrame(render);
    };
    surfaceFrame.current = window.requestAnimationFrame(render);
    return () => {
      if (surfaceFrame.current !== null) window.cancelAnimationFrame(surfaceFrame.current);
    };
  }, [reduceMotion, scrollY, surfaceTide, theme]);

  const loadArchive = useCallback(async () => {
    setArchiveStatus("loading");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setArchiveStatus("ready");
        return;
      }
      const response = await fetch("/api/archive-items", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("Archive request failed.");
      const payload = (await response.json()) as {
        items?: Array<{
          id: string;
          title: string;
          note: string;
          format: "9:16" | "16:9";
          duration: number;
          favorite: boolean;
          size: number;
          thumbnailUrl: string;
          mediaUrl: string;
          downloadUrl: string;
          section?: string;
          createdAt?: string;
        }>;
      };
      if (!payload.items) throw new Error("Archive response was incomplete.");
      setArchiveEdits(
        payload.items.map((item) => ({
          id: item.id,
          title: item.title,
          note: item.note,
          section: item.section ?? "General Vault",
          image: item.thumbnailUrl,
          size: formatBytes(item.size),
          date: item.createdAt
            ? new Date(item.createdAt)
                .toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
                .toUpperCase()
            : "Date unavailable",
          duration: formatDuration(item.duration),
          format: item.format,
          favorite: item.favorite,
          videoUrl: item.mediaUrl,
          downloadUrl: item.downloadUrl,
        })),
      );
      setSectionFilters(
        Array.from(new Set(payload.items.map((item) => item.section ?? "General Vault"))),
      );
      setArchiveStatus("ready");
    } catch {
      setArchiveStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadArchive();
  }, [loadArchive]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("edit");
    if (!requested || selected || archiveStatus !== "ready") return;
    const match = archiveEdits.find((edit) => String(edit.id) === requested);
    if (match) setSelected(match);
  }, [archiveEdits, archiveStatus, selected]);
  const visibleEdits = useMemo(
    () =>
      archiveEdits.filter((edit) => {
        if (activeFilter === "Favorites") return edit.favorite;
        if (activeFilter === "TikTok / Reels") return edit.format === "9:16";
        if (activeFilter === "Landscape") return edit.format === "16:9";
        if (["General Vault", "CapCut", "Raw Videos", "Personal Videos"].includes(activeFilter))
          return edit.section === activeFilter;
        return true;
      }),
    [activeFilter, archiveEdits],
  );

  const flashNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  const uploadOriginalEdit = useCallback(
    async (original: File, title: string, section: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");
      const thumbnail = await createThumbnail(original, original.name);
      const form = new FormData();
      form.set("file", original, original.name);
      form.set("thumbnail", thumbnail.file);
      form.set("title", title);
      form.set("section", section || "General Vault");
      form.set("width", String(thumbnail.width));
      form.set("height", String(thumbnail.height));
      form.set("duration", String(thumbnail.duration));
      const response = await fetch("/api/archive-items", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The original video could not be stored.");
      await loadArchive();
      setUploadOpen(false);
    },
    [loadArchive],
  );

  const downloadEdit = useCallback(
    async (edit: ArchiveEdit) => {
      if (!edit.downloadUrl) {
        flashNotice(`${edit.title} is a sample edit`);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        flashNotice("Your session has expired");
        return;
      }
      const url = new URL(edit.downloadUrl, window.location.origin);
      url.searchParams.set("access_token", session.access_token);
      const anchor = document.createElement("a");
      anchor.href = url.toString();
      anchor.download = `${edit.title.replace(/[^a-z0-9_-]+/gi, "-")}.mp4`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      flashNotice("Download started");
    },
    [flashNotice],
  );

  const shareEdit = useCallback(
    async (edit: ArchiveEdit) => {
      if (!edit.downloadUrl) return flashNotice("Sample edits cannot be shared");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return flashNotice("Your session has expired");
        const fileUrl = new URL(edit.downloadUrl, window.location.origin);
        fileUrl.searchParams.set("access_token", session.access_token);
        flashNotice("Preparing the video for your phone share sheet…");
        const response = await fetch(fileUrl.toString());
        if (!response.ok) throw new Error("Video download failed");
        const chunks: Uint8Array[] = [];
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
        } else chunks.push(new Uint8Array(await response.arrayBuffer()));
        const file = new File(
          chunks as unknown as BlobPart[],
          `${edit.title.replace(/[^a-z0-9_-]+/gi, "-")}.mp4`,
          {
            type: response.headers.get("content-type") || "video/mp4",
          },
        );
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: edit.title,
            text: `${edit.title} · chico’s POV`,
            files: [file],
          });
          return;
        }
        const link = new URL(window.location.href);
        link.searchParams.set("edit", String(edit.id));
        if (navigator.share)
          await navigator.share({
            title: edit.title,
            text: `${edit.title} · chico’s POV`,
            url: link.toString(),
          });
        else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(link.toString());
          flashNotice("This phone cannot share video files directly, so the video link was copied");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        const link = new URL(window.location.href);
        link.searchParams.set("edit", String(edit.id));
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(link.toString());
          flashNotice("File sharing was unavailable; the video link was copied");
        } else flashNotice("Sharing is unavailable on this device");
      }
    },
    [flashNotice],
  );
  const toggleFavorite = useCallback(
    async (edit: ArchiveEdit) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return flashNotice("Your session has expired");
      const response = await fetch(`/api/archive-items/${edit.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ favorite: !edit.favorite }),
      });
      if (!response.ok) return flashNotice("Favorite could not be updated");
      setArchiveEdits((current) =>
        current.map((item) => (item.id === edit.id ? { ...item, favorite: !edit.favorite } : item)),
      );
      flashNotice(edit.favorite ? "Removed from Favorites" : "Added to Favorites");
    },
    [flashNotice],
  );
  const deleteEdit = useCallback(
    async (edit: ArchiveEdit) => {
      if (!edit.videoUrl) {
        flashNotice("Sample edits cannot be deleted");
        return;
      }
      if (!window.confirm(`Delete “${edit.title}” permanently? This cannot be undone.`)) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        flashNotice("Your session has expired");
        return;
      }
      const response = await fetch(`/api/archive-items/${edit.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        flashNotice(payload.error ?? "Upload could not be deleted");
        return;
      }
      if (selected?.id === edit.id) setSelected(null);
      await loadArchive();
      flashNotice("Upload deleted");
    },
    [flashNotice, loadArchive, selected],
  );

  return (
    <main
      data-ocean-theme={theme}
      className="ocean-archive ios-viewport-min relative isolate overflow-hidden bg-background text-foreground"
    >
      <motion.div
        className="pointer-events-none fixed inset-[-15vh] -z-10"
        style={{ y: surfaceTide }}
      >
        <OceanCanvas theme={theme} scrollY={surfaceTide} />
      </motion.div>
      <motion.header
        style={{ y: surfaceTide }}
        className="ios-safe-header fixed inset-x-0 top-0 z-40"
      >
        <nav className="glass-panel mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6">
          <a
            href="#top"
            className="flex min-w-0 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground sm:gap-3 sm:text-xs sm:tracking-[0.22em]"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary shadow-[0_0_14px_var(--primary)]" />
            </span>
            <span className="ocean-brand truncate whitespace-nowrap">chico’s POV</span>
          </a>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              aria-label={
                theme === "calm" ? "Switch to Wavy Night theme" : "Switch to Calm Day theme"
              }
              title={theme === "calm" ? "Wavy Night" : "Calm Day"}
              variant="ghost"
              size="icon"
              onClick={() => setTheme((current) => (current === "calm" ? "night" : "calm"))}
              className="text-primary hover:bg-primary/10 hover:text-primary"
            >
              {theme === "calm" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => setUploadOpen(true)}
              className="h-11 border-primary/40 bg-primary/5 px-2 text-[10px] uppercase tracking-[0.12em] text-primary hover:border-primary hover:bg-primary/10 hover:text-primary sm:px-5 sm:text-[11px] sm:tracking-[0.16em]"
            >
              <Upload className="size-3.5" />{" "}
              <span className="hidden sm:inline">Upload new edit</span>
              <span className="sm:hidden">Upload</span>
            </Button>
            <Button
              aria-label="Open account control panel"
              title="Account control panel"
              variant="ghost"
              size="icon"
              onClick={() => setAccountOpen(true)}
              className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              <LockKeyhole className="size-4" />
            </Button>
          </div>
        </nav>
      </motion.header>

      <motion.section
        id="top"
        style={{ y: surfaceTide }}
        className="relative flex min-h-[96svh] items-center justify-center overflow-hidden px-5 pb-16 pt-28"
      >
        <div className="absolute inset-0">
          <div className="hero-readable-overlay absolute inset-0" />
          <div className="ocean-light absolute inset-0" />
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.2 }}
          className="relative z-10 mx-auto max-w-5xl text-center"
        >
          <div className="mb-9 inline-flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.32em] text-primary sm:text-[10px]">
            <span className="h-px w-10 bg-primary/40" />
            [ Private digital vault ]
            <span className="h-px w-10 bg-primary/40" />
          </div>
          <h1 className="font-display text-6xl font-light leading-[0.9] text-foreground sm:text-8xl lg:text-9xl">
            chico’s <em className="font-light text-muted-foreground">POV</em>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-[10px] uppercase leading-6 tracking-[0.22em] text-muted-foreground sm:text-xs">
            A personal ocean of memories, edits, and moments
          </p>
          <div>
            <Button
              size="lg"
              onClick={() => lenis?.scrollTo("#vault")}
              className="mt-11 h-12 border border-primary/40 bg-primary/10 px-7 text-[10px] uppercase tracking-[0.2em] text-primary shadow-[0_0_32px_var(--primary-glow)] backdrop-blur-xl hover:bg-primary hover:text-primary-foreground"
            >
              Enter archive <ArrowDown className="size-4" />
            </Button>
          </div>
        </motion.div>
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
          <span>Scroll to descend</span>
          <span className="h-10 w-px bg-gradient-to-b from-primary/50 to-transparent" />
        </div>
      </motion.section>

      <motion.div style={{ y: surfaceTide }}>
        <motion.section
          id="vault"
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.8 }}
          className="relative px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-4xl font-light sm:text-5xl">Deep Water Studies</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your private collection of edits.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  {archiveEdits.length} edits ·{" "}
                  {formatBytes(
                    archiveEdits.reduce(
                      (total, edit) =>
                        total +
                        Number.parseFloat(edit.size) *
                          (edit.size.includes("MB") ? 1024 * 1024 : 1024),
                      0,
                    ),
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadArchive()}
                  disabled={archiveStatus === "loading"}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`size-3.5 ${archiveStatus === "loading" ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="my-8 space-y-4" aria-label="Filter edits">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Browse by shape</p>
                <div
                  className="ios-scroll-x no-scrollbar flex gap-2 overflow-x-auto pb-1"
                  role="group"
                  aria-label="Filter by shape"
                >
                  {filters.map((filter) => (
                    <Button
                      key={filter}
                      aria-pressed={activeFilter === filter}
                      variant="ghost"
                      onClick={() => setActiveFilter(filter)}
                      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${activeFilter === filter ? "border-primary bg-primary/10 text-primary shadow-[0_0_18px_var(--primary-glow)]" : "border-border bg-card/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"}`}
                    >
                      {filter === "TikTok / Reels" ? "Portrait" : filter}
                    </Button>
                  ))}
                </div>
              </div>
              {sectionFilters.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Browse by section</p>
                  <div
                    className="ios-scroll-x no-scrollbar flex gap-2 overflow-x-auto pb-1"
                    role="group"
                    aria-label="Filter by section"
                  >
                    {sectionFilters.map((filter) => (
                      <Button
                        key={filter}
                        aria-pressed={activeFilter === filter}
                        variant="ghost"
                        onClick={() => setActiveFilter(filter as Category)}
                        className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${activeFilter === filter ? "border-primary bg-primary/10 text-primary shadow-[0_0_18px_var(--primary-glow)]" : "border-border bg-card/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"}`}
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {archiveStatus !== "ready" && (
              <div
                role={archiveStatus === "error" ? "alert" : "status"}
                aria-live={archiveStatus === "error" ? "assertive" : "polite"}
                className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${archiveStatus === "error" ? "border-destructive/30 bg-destructive/5 text-foreground" : "border-border bg-card/30 text-muted-foreground"}`}
              >
                <span>
                  {archiveStatus === "error"
                    ? "The archive could not be refreshed. Available edits remain on screen."
                    : "Loading your archive…"}
                </span>
                {archiveStatus === "error" && (
                  <Button variant="ghost" size="sm" onClick={() => void loadArchive()}>
                    Try again
                  </Button>
                )}
              </div>
            )}
            <motion.div
              layout
              className="grid grid-cols-2 gap-3 sm:gap-x-6 sm:gap-y-8 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {visibleEdits.map((edit, index) => (
                  <motion.div layout key={edit.id} className="min-w-0">
                    <motion.article
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.12 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.8, delay: index * 0.055 }}
                      {...(reduceMotion ? {} : { whileHover: { y: -4 } })}
                      className="glass-card group min-w-0 max-w-full overflow-hidden"
                    >
                      <div
                        className={`relative min-h-0 overflow-hidden rounded-t-[inherit] bg-secondary ${edit.format === "9:16" ? "aspect-[9/16]" : "aspect-[16/10]"}`}
                      >
                        <PrivateThumbnail
                          src={edit.image}
                          alt={`${edit.title} video thumbnail`}
                          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-200 group-hover:opacity-100"
                        />
                        {edit.videoUrl && (
                          <PrivateVideoPreview
                            src={edit.videoUrl}
                            poster={edit.image}
                            title={edit.title}
                          />
                        )}
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--card),transparent_58%)] opacity-70" />
                        <div className="absolute left-2 top-2 border border-border bg-background/70 px-2 py-1 font-mono text-[8px] tracking-[0.12em] text-foreground backdrop-blur-md sm:left-4 sm:top-4 sm:text-[9px]">
                          {edit.format}
                        </div>
                        <div className="absolute right-2 top-2 rounded-md bg-background/70 px-2 py-1 font-mono text-[9px] text-foreground backdrop-blur-md sm:right-4 sm:top-4 sm:text-[10px]">
                          {edit.duration}
                        </div>
                        <Button
                          aria-label={`Play ${edit.title}`}
                          onClick={() => setSelected(edit)}
                          size="icon"
                          className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/70 bg-background/60 text-primary shadow-[0_0_24px_var(--primary-glow)] backdrop-blur-xl transition-transform hover:scale-105 hover:bg-primary hover:text-primary-foreground sm:size-12"
                        >
                          <Play className="ml-0.5 size-4 fill-current" />
                        </Button>
                      </div>
                      <div className="min-w-0 p-3 sm:p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 break-words font-display text-base leading-tight sm:text-2xl">
                              {edit.title}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">
                              {edit.section ?? edit.note}
                            </p>
                          </div>
                          <span className="shrink-0 border border-border px-1.5 py-1 font-mono text-[8px] text-muted-foreground sm:px-2 sm:text-[9px]">
                            {edit.size}
                          </span>
                        </div>
                        {edit.videoUrl && (
                          <div className="mt-3 border-y border-border/80 py-1 sm:mt-5 sm:py-2">
                            <div className="flex items-center justify-between">
                              <Button
                                title={edit.favorite ? "Remove from Favorites" : "Add to Favorites"}
                                aria-label={
                                  edit.favorite
                                    ? `Remove ${edit.title} from Favorites`
                                    : `Add ${edit.title} to Favorites`
                                }
                                variant="ghost"
                                size="icon"
                                onClick={() => void toggleFavorite(edit)}
                                className="size-9 text-foreground hover:bg-primary/20 hover:text-primary sm:size-10"
                              >
                                <Heart
                                  className={`size-4 ${edit.favorite ? "fill-primary text-primary" : ""}`}
                                />
                              </Button>
                              <Button
                                title="Download MP4"
                                aria-label={`Download ${edit.title}`}
                                variant="ghost"
                                size="icon"
                                onClick={() => void downloadEdit(edit)}
                                className="size-9 text-foreground hover:bg-primary/20 hover:text-primary sm:size-10"
                              >
                                <Download className="size-4" />
                              </Button>
                              <Button
                                title="More actions"
                                aria-label={`More actions for ${edit.title}`}
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setMoreOpen((current) => (current === edit.id ? null : edit.id))
                                }
                                className="size-10 text-foreground hover:bg-primary/20 hover:text-primary"
                              >
                                <MoreHorizontal className="size-5" />
                              </Button>
                            </div>
                            {moreOpen === edit.id && (
                              <div className="mt-2 flex gap-2 border-t border-border/60 pt-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setMoreOpen(null);
                                    void shareEdit(edit);
                                  }}
                                  className="min-h-10 flex-1 justify-start gap-2 text-sm"
                                >
                                  <Share2 className="size-4" /> Share
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setMoreOpen(null);
                                    void deleteEdit(edit);
                                  }}
                                  className="min-h-10 flex-1 justify-start gap-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="size-4" /> Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between sm:mt-5">
                          <span className="truncate font-mono text-[8px] tracking-[0.08em] text-muted-foreground sm:text-[9px] sm:tracking-[0.13em]">
                            {edit.date}
                          </span>
                          {edit.favorite && !edit.videoUrl && (
                            <Heart
                              className="size-3.5 fill-primary text-primary"
                              aria-label="Favorite"
                            />
                          )}
                        </div>
                      </div>
                    </motion.article>
                  </motion.div>
                ))}
              </AnimatePresence>
              {archiveStatus === "ready" && visibleEdits.length === 0 && (
                <div className="glass-panel col-span-full mx-auto flex w-full max-w-xl flex-col items-center px-6 py-12 text-center sm:px-10">
                  <div className="flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <Video className="size-5" />
                  </div>
                  <h3 className="mt-5 font-display text-3xl">
                    {archiveEdits.length === 0 ? "Your archive is ready" : "No edits in this view"}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    {archiveEdits.length === 0
                      ? "Upload a video to begin building your private collection."
                      : "Try another filter to find the edit you’re looking for."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      archiveEdits.length === 0 ? setUploadOpen(true) : setActiveFilter("All Edits")
                    }
                    className="mt-6 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {archiveEdits.length === 0 ? "Upload your first edit" : "Show all edits"}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </motion.section>
      </motion.div>

      <motion.footer
        style={{ y: surfaceTide }}
        className="border-t border-border px-5 py-10 sm:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Private collection · Forever yours
          </p>
          <div className="relative">
            <Button
              title="A small secret"
              aria-label="Open developer vault"
              variant="ghost"
              size="icon"
              onClick={() => setDeveloperVault((value) => !value)}
              className="group relative opacity-30 hover:bg-transparent hover:text-primary hover:opacity-100"
            >
              {developerVault && (
                <span className="absolute inset-0 animate-ping rounded-full border border-primary" />
              )}
              <Cat className="size-4" />
            </Button>
          </div>
        </div>
      </motion.footer>

      <UploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={flashNotice}
        onUpload={uploadOriginalEdit}
      />
      <AccountPanel
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onNotice={flashNotice}
        onSignedOut={() => void navigate({ to: "/login", replace: true })}
      />
      <AnimatePresence>
        {developerVault && <DeveloperDashboard embedded onClose={() => setDeveloperVault(false)} />}
      </AnimatePresence>
      <CinematicPlayer
        edit={selected}
        onClose={() => setSelected(null)}
        onSave={(title) => flashNotice(`${title} downloaded`)}
      />

      <AnimatePresence>
        {notice && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="ios-safe-toast fixed left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-primary/30 bg-card/95 px-4 py-3 text-xs text-foreground shadow-[0_0_30px_var(--primary-glow)] backdrop-blur-xl"
          >
            <Check className="size-4 text-primary" />
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
