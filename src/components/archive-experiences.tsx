import { AuthGate } from "./AuthGate";
import { StealthConsole } from "./StealthConsole";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  Cloud,
  Download,
  Gauge,
  HardDrive,
  ImageDown,
  Pause,
  Play,
  Server,
  Settings2,
  ShieldCheck,
  UploadCloud,
  Video,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cancelCompression, compressVideo } from "@/lib/video-compressor";

export type ArchiveEdit = {
  id: number | string;
  title: string;
  note: string;
  image: string;
  size: string;
  date: string;
  createdAt?: string;
  duration: string;
  format: "9:16" | "16:9";
  favorite: boolean;
  section?: string;
  videoUrl?: string;
  downloadUrl?: string;
};

type UploadDrawerProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (message: string) => void;
  onUpload?: (original: File, playback: File, title: string, section: string) => Promise<void>;
};

type UploadPhase = "idle" | "uploading" | "ready" | "error";

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function UploadDrawer({ open, onClose, onComplete, onUpload }: UploadDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("General Vault");
  const [customSection, setCustomSection] = useState("");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setProgress(0.05);
    setPhase("uploading");
    try {
      const compressed = await compressVideo(
        selectedFile,
        ({ phase: compressionPhase, progress }) => {
          setProgress(compressionPhase === "loading" ? progress * 0.2 : 0.2 + progress * 0.35);
        },
      );
      const playback = new File([compressed.blob], compressed.fileName, { type: "video/mp4" });
      if (onUpload)
        await onUpload(
          selectedFile,
          playback,
          title.trim() || selectedFile.name.replace(/\.[^/.]+$/, ""),
          section === "Custom" ? customSection.trim() || "General Vault" : section,
        );
      setProgress(1);
      setPhase("ready");
      onComplete(`${selectedFile.name} stored at original quality`);
    } catch (uploadError) {
      setPhase("error");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : `Upload failed: ${String(uploadError)}. Please try again.`,
      );
    }
  };

  const chooseFile = (selectedFile?: File) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("video/")) {
      setError("Choose a supported video file: MP4, MOV, or WEBM.");
      return;
    }
    void processFile(selectedFile);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };
  const reset = () => {
    cancelCompression();
    setFile(null);
    setTitle("");
    setSection("General Vault");
    setCustomSection("");
    setError(null);
    setProgress(0);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overscroll-contain bg-background/75 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Upload new edit"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            onClick={(event) => event.stopPropagation()}
            className="ios-drawer-panel glass-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto overscroll-contain"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                  New transmission
                </p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl">Upload an edit</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stored privately at original quality. Nothing is compressed.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close upload drawer"
                onClick={onClose}
              >
                <X />
              </Button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={handleInput}
            />
            <div
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className={`ocean-border mt-8 flex min-h-60 shrink-0 flex-col items-center justify-center rounded-2xl p-6 text-center transition-colors sm:min-h-64 sm:p-8 ${dragging ? "bg-primary/10" : "bg-background/30"}`}
            >
              <motion.div
                animate={dragging ? { y: [-4, 4, -4] } : { y: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_35px_var(--primary-glow)]"
              >
                <UploadCloud className="size-7" />
              </motion.div>
              <h3 className="mt-6 text-base font-medium">Drag a video here or browse</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                MP4, MOV or WEBM · uploaded directly to private storage
              </p>
              <Button
                variant="outline"
                className="mt-6 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </Button>
            </div>

            <label className="mt-5 block text-left">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Video name
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give this memory a name"
                className="mt-2 w-full rounded-lg border border-border bg-background/40 px-3 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
              />
            </label>
            <label className="mt-4 block text-left">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Vault section
              </span>
              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className="ocean-select mt-2 w-full"
              >
                <option>General Vault</option>
                <option>CapCut</option>
                <option>Raw Videos</option>
                <option>Personal Videos</option>
                <option value="Custom">Custom section…</option>
              </select>
              {section === "Custom" && (
                <input
                  value={customSection}
                  onChange={(event) => setCustomSection(event.target.value)}
                  placeholder="e.g. Wedding edits"
                  className="mt-2 w-full rounded-lg border border-border bg-background/40 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
              )}
            </label>
            {error && !file && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
              >
                {error}
              </p>
            )}

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel mt-6 p-5"
                  role={phase === "error" ? "alert" : "status"}
                  aria-live={phase === "error" ? "assertive" : "polite"}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center bg-primary/10 text-primary">
                      <Video className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
                        {phase === "uploading"
                          ? "Preparing fast phone playback + original backup"
                          : phase === "ready"
                            ? "Original media stored · ready to play"
                            : "Upload failed"}
                      </p>
                    </div>
                    {phase === "ready" && <Check className="size-5 text-primary" />}
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Upload progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    {...(phase !== "uploading"
                      ? { "aria-valuenow": Math.round(progress * 100) }
                      : { "aria-valuetext": "Upload in progress" })}
                    className="mt-5 h-1 overflow-hidden rounded-full bg-muted"
                  >
                    <motion.div
                      className="h-full bg-primary shadow-[0_0_16px_var(--primary)]"
                      style={{ width: phase === "uploading" ? "40%" : "100%" }}
                      animate={phase === "uploading" ? { x: ["-100%", "250%"] } : { x: 0 }}
                      transition={
                        phase === "uploading"
                          ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                          : { duration: 0.3 }
                      }
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-[9px] text-muted-foreground">
                    <span>
                      {phase === "uploading"
                        ? "Preparing playback, then sending both copies privately"
                        : phase === "ready"
                          ? "Stored at original quality and ready"
                          : error}
                    </span>
                    <span>
                      {phase === "uploading" ? "Working…" : `${Math.round(progress * 100)}%`}
                    </span>
                  </div>
                  <div className="mt-5 flex gap-2">
                    {phase === "uploading" && (
                      <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                        Cancel
                      </Button>
                    )}
                    {(phase === "ready" || phase === "error") && (
                      <Button
                        variant="outline"
                        onClick={reset}
                        className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        Choose another
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="mt-auto flex items-center gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" /> Private direct upload · original
                  quality is stored
                </div>
              )}
            </AnimatePresence>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DeveloperDashboard({
  embedded = false,
  onClose,
}: {
  embedded?: boolean;
  onClose?: () => void;
}) {
  const [originalQuality, setOriginalQuality] = useState(true);
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");
  const [statsState, setStatsState] = useState<"loading" | "ready" | "error">("loading");
  const [stats, setStats] = useState<{
    totalBytes: number;
    originalBytes: number;
    playbackBytes: number;
    thumbnailBytes: number;
    r2Bytes: number;
    b2Bytes: number;
    itemCount: number;
    storageLimitBytes: number;
    remainingBytes: number;
  } | null>(null);

  const formatMetricBytes = (bytes: number) => {
    if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active) setAccess("denied");
        return;
      }
      const { data: membership, error } = await supabase
        .from("archive_memberships")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (active) setAccess(!error && membership?.role === "developer" ? "granted" : "denied");
      if (!error && membership?.role === "developer") {
        const response = await fetch("/api/archive-stats", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) throw new Error("Stats request failed.");
        const payload = (await response.json()) as typeof stats;
        if (active) {
          setStats(payload);
          setStatsState("ready");
        }
      }
    })().catch(() => {
      if (active) setStatsState("error");
    });
    return () => {
      active = false;
    };
  }, []);

  if (access === "checking") {
    return (
      <main className="ocean-archive ios-viewport-min relative isolate flex items-center justify-center px-5 text-foreground">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Verifying developer access…
        </p>
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="ocean-archive ios-viewport-min relative isolate flex items-center justify-center px-5 text-foreground">
        <section className="glass-panel max-w-md p-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
            Access denied
          </p>
          <h1 className="mt-3 font-display text-4xl">Developer access required</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This control room is restricted to authenticated developer accounts.
          </p>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="mt-6">
              Return to archive
            </Button>
          )}
        </section>
      </main>
    );
  }

  const content = (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            Restricted systems
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-6xl">Developer vault</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Private archive infrastructure, storage controls, and live system health.
          </p>
        </div>
        {onClose && (
          <Button
            variant="outline"
            size="icon"
            aria-label="Close developer dashboard"
            onClick={onClose}
          >
            <X />
          </Button>
        )}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Metric
          icon={HardDrive}
          label="Storage capacity"
          value={
            stats
              ? `${formatMetricBytes(stats.totalBytes)} / ${formatMetricBytes(stats.storageLimitBytes)}`
              : statsState === "error"
                ? "Unavailable"
                : "Loading…"
          }
          {...(stats
            ? {
                progress: Math.min(
                  100,
                  (stats.totalBytes / Math.max(1, stats.storageLimitBytes)) * 100,
                ),
              }
            : {})}
          detail={
            stats
              ? `${formatMetricBytes(stats.remainingBytes)} remaining · ${Math.min(100, (stats.totalBytes / Math.max(1, stats.storageLimitBytes)) * 100).toFixed(2)}% used`
              : statsState === "error"
                ? "Storage metrics could not be loaded"
                : "Tracked original-quality media and thumbnails"
          }
        />
        <Metric
          icon={Cloud}
          label="Active bucket"
          value="Cloudflare R2"
          detail="Primary region · Auto"
        />
        <Metric
          icon={Video}
          label="Total edits stored"
          value={
            stats ? String(stats.itemCount) : statsState === "error" ? "Unavailable" : "Loading…"
          }
          detail={
            stats
              ? `${formatMetricBytes(stats.originalBytes)} original-quality media`
              : statsState === "error"
                ? "Archive metrics could not be loaded"
                : "Reading archive"
          }
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass-card p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-4">
              <div className="flex size-10 items-center justify-center bg-primary/10 text-primary">
                <Zap className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Store Original Video Quality</h2>
                <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                  Keep the complete uploaded video without browser original-quality storage or
                  quality loss.
                </p>
              </div>
            </div>
            <Button
              role="switch"
              aria-checked={originalQuality}
              aria-label="Toggle original-quality storage"
              onClick={() => setOriginalQuality((value) => !value)}
              variant="ghost"
              className="relative size-11 min-h-11 rounded-full border-0 bg-transparent p-0 hover:bg-primary/5"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-1/2 top-1/2 h-7 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border ${originalQuality ? "border-primary bg-primary/20" : "border-border bg-muted"}`}
              />
              <motion.span
                layout
                aria-hidden="true"
                className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full ${originalQuality ? "left-[1.625rem] bg-primary shadow-[0_0_12px_var(--primary)]" : "left-1 bg-muted-foreground"}`}
              />
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-3">
            <SmallStat
              label="Original-quality media"
              value={
                stats
                  ? formatMetricBytes(stats.originalBytes)
                  : statsState === "error"
                    ? "Unavailable"
                    : "Loading…"
              }
            />
            <SmallStat
              label="Playback copies"
              value={
                stats
                  ? formatMetricBytes(stats.playbackBytes)
                  : statsState === "error"
                    ? "Unavailable"
                    : "Loading…"
              }
            />
            <SmallStat
              label="Thumbnails"
              value={
                stats
                  ? formatMetricBytes(stats.thumbnailBytes)
                  : statsState === "error"
                    ? "Unavailable"
                    : "Loading…"
              }
            />
            <SmallStat
              label="R2 usage"
              value={
                stats
                  ? formatMetricBytes(stats.r2Bytes)
                  : statsState === "error"
                    ? "Unavailable"
                    : "Loading…"
              }
            />
          </div>
        </section>
        <section className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="size-5 text-primary" />
              <h2 className="text-sm font-semibold">R2 Primary Bucket</h2>
            </div>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          </div>
          <div className="mt-8 flex items-end justify-between">
            <div>
              <p className="font-display text-3xl text-primary">Operational</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                All systems nominal
              </p>
            </div>
            <Gauge className="size-9 text-muted-foreground" />
          </div>
        </section>
      </div>
    </div>
  );
  if (!embedded)
    return (
      <main className="ocean-archive ios-viewport-min relative isolate px-5 py-24 text-foreground sm:px-8">
        {content}
      </main>
    );
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Developer vault"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ios-safe-overlay items-start fixed inset-0 z-50 bg-background/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        className="mx-auto w-full"
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  progress,
}: {
  icon: typeof HardDrive;
  label: string;
  value: string;
  detail: string;
  progress?: number;
}) {
  return (
    <section className="glass-card p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-8 font-display text-2xl text-foreground">{value}</p>
      {progress !== undefined && (
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="mt-4 h-1 overflow-hidden bg-muted"
        >
          <div
            className="h-full bg-primary shadow-[0_0_14px_var(--primary-glow)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </section>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function CinematicPlayer({
  edit,
  onClose,
  onSave,
}: {
  edit: ArchiveEdit | null;
  onClose: () => void;
  onSave: (title: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerSurfaceRef = useRef<HTMLDivElement>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  useEffect(() => {
    setPlaying(false);
    setPosition(0);
    setCurrentSeconds(0);
    setDurationSeconds(0);
    setMuted(false);
  }, [edit]);
  useEffect(() => {
    setVideoSource(null);
    setMediaError(null);
    if (!edit?.videoUrl) return;
    let active = true;
    const applySession = (accessToken: string) => {
      const url = new URL(edit.videoUrl!, window.location.origin);
      url.searchParams.set("access_token", accessToken);
      if (active) setVideoSource(url.toString());
    };
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired.");
      applySession(session.access_token);
    })().catch((error: unknown) => {
      if (active) setMediaError(error instanceof Error ? error.message : "Video playback failed.");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) applySession(session.access_token);
      if (event === "SIGNED_OUT" && active) {
        setVideoSource(null);
        setMediaError("Your session has expired. Please sign in again to play this video.");
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [edit]);
  useEffect(() => {
    if (!edit) return;
    const frame = window.requestAnimationFrame(() => playerSurfaceRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [edit]);
  const formatClock = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };
  useEffect(() => {
    if (!edit) return;
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest("input, textarea, button, select")) return;
      const video = videoRef.current;
      if (!video) return;
      if (event.key === " " || event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5);
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        video.muted = !video.muted;
        setMuted(video.muted);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [edit]);

  return (
    <AnimatePresence>
      {edit && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${edit.title} cinematic player`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="ios-viewport-min fixed inset-0 z-50 flex flex-col bg-background"
          onClick={onClose}
        >
          <div className="ios-player-topbar flex shrink-0 items-center justify-between border-b border-border">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft /> Back to vault
            </Button>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
              Private playback · 4K
            </span>
            <Button variant="ghost" size="icon" aria-label="Close video player" onClick={onClose}>
              <X />
            </Button>
          </div>
          <motion.div
            ref={playerSurfaceRef}
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
            onClick={(event) => event.stopPropagation()}
            tabIndex={0}
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-background outline-none"
          >
            {edit.videoUrl && mediaError ? (
              <div
                role="alert"
                aria-live="assertive"
                className="max-w-md px-6 text-center text-sm leading-6 text-muted-foreground"
              >
                <Video className="mx-auto mb-3 size-10 text-destructive" />
                {mediaError}
              </div>
            ) : edit.videoUrl && videoSource ? (
              <video
                src={videoSource}
                ref={videoRef}
                playsInline
                preload="metadata"
                poster={edit.image}
                className="max-h-full max-w-full object-contain"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onLoadedMetadata={(event) => setDurationSeconds(event.currentTarget.duration)}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  setCurrentSeconds(video.currentTime);
                  setPosition(video.duration ? (video.currentTime / video.duration) * 100 : 0);
                }}
                onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
                onError={() =>
                  setMediaError(
                    "This video format is not supported by this phone or browser. The original file is still safe.",
                  )
                }
              />
            ) : !edit.videoUrl ? (
              <div className="relative flex h-full w-full items-center justify-center bg-background">
                <img
                  src={edit.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain opacity-60"
                />
                <div className="absolute inset-0 bg-background/55 backdrop-blur-sm" />
                <div className="relative z-10 flex max-w-md flex-col items-center gap-3 px-6 text-center">
                  <Video className="size-10 text-primary" />
                  <p className="font-display text-3xl text-foreground">Sample preview</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The private original video isn’t attached to this sample edit.
                  </p>
                </div>
              </div>
            ) : (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-3 px-6 text-center text-sm text-muted-foreground"
              >
                <Video className="size-10 text-primary" />
                Loading private original video…
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_62%,var(--background))]" />
            {videoSource && !playing && (
              <Button
                aria-label={`Play ${edit.title}`}
                size="icon"
                onClick={togglePlayback}
                className="absolute left-1/2 top-1/2 z-20 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/50 bg-background/45 text-primary backdrop-blur-lg hover:bg-primary hover:text-primary-foreground"
              >
                <Play className="ml-1 size-6 fill-current" />
              </Button>
            )}
            <div
              className="ios-player-controls absolute inset-x-0 bottom-0 z-30 pt-4"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <input
                aria-label="Video playback position"
                type="range"
                disabled={!videoSource}
                min="0"
                max="100"
                value={position}
                onChange={(event) => {
                  const nextPosition = Number(event.target.value);
                  setPosition(nextPosition);
                  if (videoRef.current && durationSeconds) {
                    videoRef.current.currentTime = (nextPosition / 100) * durationSeconds;
                  }
                }}
                className="video-range w-full"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={!videoSource}
                  aria-label={playing ? "Pause video" : "Play video"}
                  onClick={togglePlayback}
                >
                  {playing ? <Pause /> : <Play className="fill-current" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!videoSource}
                  aria-label={muted ? "Unmute video" : "Mute video"}
                  onClick={() => {
                    if (!videoRef.current) return;
                    videoRef.current.muted = !videoRef.current.muted;
                    setMuted(videoRef.current.muted);
                  }}
                >
                  <Volume2
                    className={`size-4 ${muted ? "text-destructive" : "text-muted-foreground"}`}
                  />
                </Button>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {formatClock(currentSeconds)} / {formatClock(durationSeconds || 0)}
                </span>
                <div className="min-w-0 flex-1 sm:ml-4">
                  <h2 className="truncate font-display text-xl sm:text-3xl">{edit.title}</h2>
                  <p className="text-xs text-muted-foreground">{edit.note}</p>
                </div>
                <Button
                  disabled={!edit.downloadUrl}
                  onClick={() => {
                    void (async () => {
                      if (!edit.downloadUrl) return onSave(edit.title);
                      const {
                        data: { session },
                      } = await supabase.auth.getSession();
                      if (!session) return onSave(edit.title);
                      const downloadUrl = new URL(edit.downloadUrl, window.location.origin);
                      downloadUrl.searchParams.set("access_token", session.access_token);
                      const anchor = document.createElement("a");
                      anchor.href = downloadUrl.toString();
                      anchor.download = `${edit.title.replace(/[^a-z0-9_-]+/gi, "-")}.mp4`;
                      anchor.rel = "noopener";
                      document.body.appendChild(anchor);
                      anchor.click();
                      anchor.remove();
                      onSave(edit.title);
                    })();
                  }}
                  className="w-full bg-primary text-primary-foreground shadow-[0_0_25px_var(--primary-glow)] hover:bg-primary/90 sm:w-auto"
                >
                  <ImageDown />
                  {edit.downloadUrl
                    ? "Save to Phone Camera Roll"
                    : "Sample preview · no original to save"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ArchiveExperiences() {
  return (
    <AuthGate>
      <main className="relative min-h-screen bg-background text-foreground">
        {/* Main Vault Content Rendered Here */}
        <StealthConsole />
      </main>
    </AuthGate>
  );
}
