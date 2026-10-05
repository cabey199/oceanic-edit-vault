import { StealthConsole } from './StealthConsole';
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

export type ArchiveEdit = {
  id: number;
  title: string;
  note: string;
  image: string;
  size: string;
  date: string;
  duration: string;
  format: "9:16" | "16:9";
  favorite: boolean;
};

type UploadDrawerProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (message: string) => void;
};

export function UploadDrawer({ open, onClose, onComplete }: UploadDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!fileName || progress >= 100) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + (value < 60 ? 7 : 3), 100));
    }, 140);
    return () => window.clearInterval(timer);
  }, [fileName, progress]);

  useEffect(() => {
    if (progress !== 100) return;
    const timer = window.setTimeout(() => onComplete(`${fileName} compressed and ready`), 500);
    return () => window.clearTimeout(timer);
  }, [fileName, onComplete, progress]);

  const chooseFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setProgress(4);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-background/75 backdrop-blur-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside role="dialog" aria-modal="true" aria-label="Upload new edit" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }} onClick={(event) => event.stopPropagation()} className="glass-panel absolute inset-y-0 right-0 flex w-full max-w-xl flex-col p-6 sm:p-10">
            <div className="flex items-start justify-between gap-6">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">New transmission</p><h2 className="mt-3 font-display text-4xl">Upload an edit</h2><p className="mt-2 text-sm text-muted-foreground">Your footage is prepared locally before entering the vault.</p></div>
              <Button variant="ghost" size="icon" aria-label="Close upload drawer" onClick={onClose}><X /></Button>
            </div>

            <input ref={inputRef} type="file" accept="video/mp4,video/*" className="hidden" onChange={handleInput} />
            <div onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className={`ocean-border mt-10 flex min-h-72 flex-col items-center justify-center p-8 text-center transition ${dragging ? "bg-primary/10" : "bg-background/30"}`}>
              <motion.div animate={dragging ? { y: [-4, 4, -4] } : { y: 0 }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_35px_var(--primary-glow)]"><UploadCloud className="size-7" /></motion.div>
              <h3 className="mt-6 text-base font-medium">Drag MP4 files here or browse</h3>
              <p className="mt-2 text-xs text-muted-foreground">MP4, MOV or WEBM · Up to 2 GB</p>
              <Button variant="outline" className="mt-6 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => inputRef.current?.click()}>Browse files</Button>
            </div>

            <AnimatePresence mode="wait">
              {fileName ? (
                <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel mt-6 p-5">
                  <div className="flex items-center gap-4"><div className="flex size-10 items-center justify-center bg-primary/10 text-primary"><Video className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{fileName}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">{progress < 100 ? "Optimizing: 84 MB → 18 MB (-78%)" : "Compression complete · 78% saved"}</p></div>{progress === 100 && <Check className="size-5 text-primary" />}</div>
                  <div className="mt-5 grid grid-cols-3 gap-3 border-y border-border py-3 font-mono text-[9px] uppercase tracking-[0.12em]"><div><p className="text-muted-foreground">Source</p><p className="mt-1 text-foreground">84 MB</p></div><div><p className="text-muted-foreground">Optimized</p><p className="mt-1 text-foreground">18 MB</p></div><div><p className="text-muted-foreground">Saved</p><p className="mt-1 text-primary">78%</p></div></div>
                  <div className="mt-5 h-1 overflow-hidden bg-muted"><motion.div className="h-full bg-primary shadow-[0_0_16px_var(--primary)]" animate={{ width: `${progress}%` }} /></div>
                  <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>{progress < 100 ? "Optimizing for instant playback" : "Ready for the archive"}</span><span>{progress}%</span></div>
                </motion.div>
              ) : <div className="mt-auto flex items-center gap-3 border-t border-border pt-6 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Private transfer with local pre-processing</div>}
            </AnimatePresence>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DeveloperDashboard({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const [compress, setCompress] = useState(true);
  const content = (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-start justify-between gap-6">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Restricted systems</p><h1 className="mt-3 font-display text-4xl sm:text-6xl">Developer vault</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Private archive infrastructure, compression controls, and live system health.</p></div>
        {onClose && <Button variant="outline" size="icon" aria-label="Close developer dashboard" onClick={onClose}><X /></Button>}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Metric icon={HardDrive} label="Storage capacity" value="12.4 GB / 20 GB" detail="7.6 GB free" progress={62} />
        <Metric icon={Cloud} label="Active bucket" value="Cloudflare R2" detail="Primary region · Auto" />
        <Metric icon={Video} label="Total edits stored" value="142" detail="18 added this month" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass-card p-6">
          <div className="flex items-start justify-between gap-6"><div className="flex gap-4"><div className="flex size-10 items-center justify-center bg-primary/10 text-primary"><Zap className="size-5" /></div><div><h2 className="text-sm font-semibold">Auto-Compress Videos Client-Side</h2><p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">Reduce file size before upload while keeping social-ready visual quality.</p></div></div><Button role="switch" aria-checked={compress} aria-label="Toggle automatic video compression" onClick={() => setCompress((value) => !value)} variant="ghost" className={`h-7 w-12 rounded-full border p-1 ${compress ? "border-primary bg-primary/20" : "border-border bg-muted"}`}><motion.span layout className={`block size-4 rounded-full ${compress ? "ml-5 bg-primary shadow-[0_0_12px_var(--primary)]" : "mr-5 bg-muted-foreground"}`} /></Button></div>
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6"><SmallStat label="Average saving" value="73%" /><SmallStat label="Quality target" value="4K" /><SmallStat label="Codec" value="H.265" /></div>
        </section>
        <section className="glass-card p-6">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Server className="size-5 text-primary" /><h2 className="text-sm font-semibold">R2 Primary Bucket</h2></div><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-primary" /></span></div>
          <div className="mt-8 flex items-end justify-between"><div><p className="font-display text-3xl text-primary">Operational</p><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">All systems nominal</p></div><Gauge className="size-9 text-muted-foreground" /></div>
        </section>
      </div>
    </div>
  );
  if (!embedded) return <main className="min-h-screen bg-background px-5 py-24 text-foreground sm:px-8">{content}</main>;
  return <motion.div role="dialog" aria-modal="true" aria-label="Developer vault" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-background/90 px-5 py-16 backdrop-blur-2xl sm:px-8" onClick={onClose}><motion.div initial={{ scale: .98, y: 16 }} animate={{ scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}>{content}</motion.div></motion.div>;
}

function Metric({ icon: Icon, label, value, detail, progress }: { icon: typeof HardDrive; label: string; value: string; detail: string; progress?: number }) {
  return <section className="glass-card p-6"><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span><Icon className="size-4 text-primary" /></div><p className="mt-8 font-display text-2xl text-foreground">{value}</p>{progress !== undefined && <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="mt-4 h-1 overflow-hidden bg-muted"><div className="h-full bg-primary shadow-[0_0_14px_var(--primary-glow)]" style={{ width: `${progress}%` }} /></div>}<p className="mt-2 text-xs text-muted-foreground">{detail}</p></section>;
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return <div><p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-sm text-foreground">{value}</p></div>;
}

export function CinematicPlayer({ edit, onClose, onSave }: { edit: ArchiveEdit | null; onClose: () => void; onSave: (title: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(22);
  useEffect(() => {
    if (!playing || !edit) return;
    const timer = window.setInterval(() => setPosition((value) => value >= 100 ? 0 : value + 1), 300);
    return () => window.clearInterval(timer);
  }, [edit, playing]);
  useEffect(() => { setPlaying(false); setPosition(22); }, [edit]);

  return <AnimatePresence>{edit && <motion.div role="dialog" aria-modal="true" aria-label={`${edit.title} cinematic player`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col bg-background" onClick={onClose}>
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-7"><Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground"><ChevronLeft /> Back to vault</Button><span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:block">Private playback · 4K</span><Button variant="ghost" size="icon" aria-label="Close video player" onClick={onClose}><X /></Button></div>
    <motion.div initial={{ scale: 1.02 }} animate={{ scale: 1 }} onClick={(event) => event.stopPropagation()} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-background">
      <img src={edit.image} alt={`${edit.title} cinematic preview`} className={`h-full w-full object-contain transition duration-700 ${playing ? "scale-[1.015]" : "scale-100"}`} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_62%,var(--background))]" />
      {!playing && <Button aria-label={`Play ${edit.title}`} size="icon" onClick={() => setPlaying(true)} className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/50 bg-background/45 text-primary backdrop-blur-lg hover:bg-primary hover:text-primary-foreground"><Play className="ml-1 size-6 fill-current" /></Button>}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
        <input aria-label="Video playback position" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} className="video-range w-full" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="icon" variant="ghost" aria-label={playing ? "Pause video" : "Play video"} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause /> : <Play className="fill-current" />}</Button>
          <Volume2 className="size-4 text-muted-foreground" />
          <span className="font-mono text-[9px] text-muted-foreground">00:{String(Math.round(position * .24)).padStart(2, "0")} / {edit.duration}</span>
          <div className="min-w-0 flex-1 sm:ml-4"><h2 className="truncate font-display text-xl sm:text-3xl">{edit.title}</h2><p className="text-xs text-muted-foreground">{edit.note}</p></div>
          <Button onClick={() => onSave(edit.title)} className="w-full bg-primary text-primary-foreground shadow-[0_0_25px_var(--primary-glow)] hover:bg-primary/90 sm:w-auto"><ImageDown /> Save to Phone Camera Roll</Button>
        </div>
        <StealthConsole />
      </div>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
