import { AnimatePresence, motion } from "framer-motion";
import { Check, HardDrive, Mail, ShieldCheck, UserPlus, X, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type AccountPanelProps = {
  open: boolean;
  onClose: () => void;
  onNotice: (message: string) => void;
  onSignedOut?: () => void;
};

type Feedback = { kind: "success" | "error"; message: string } | null;
type ArchiveStats = {
  totalBytes: number;
  originalBytes: number;
  itemCount: number;
  r2Bytes: number;
  b2Bytes: number;
  storageLimitBytes: number;
  remainingBytes: number | null;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
};

export function AccountPanel({ open, onClose, onNotice, onSignedOut }: AccountPanelProps) {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<Feedback>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [statsBusy, setStatsBusy] = useState(false);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? "");
    });
    setStatsBusy(true);
    setStatsError(false);
    void supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session) throw new Error("Session unavailable.");
        const response = await fetch("/api/archive-stats", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) throw new Error("Archive metrics unavailable.");
        const nextStats = (await response.json()) as ArchiveStats;
        if (active) setStats(nextStats);
        if (active) setStatsBusy(false);
      })
      .catch(() => {
        if (active) {
          setStatsError(true);
          setStatsBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [open]);

  const updateEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newEmail || newEmail === email) return;
    setEmailBusy(true);
    setFeedback(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailBusy(false);
    if (error) {
      setFeedback({ kind: "error", message: error.message });
      return;
    }
    setEmail(newEmail);
    setNewEmail("");
    setFeedback({ kind: "success", message: "Check the new address to confirm the email change." });
    onNotice("Email change requested");
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      setFeedback({ kind: "error", message: "Use at least 6 characters for the new password." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ kind: "error", message: "The password confirmation does not match." });
      return;
    }
    setPasswordBusy(true);
    setFeedback(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) {
      setFeedback({ kind: "error", message: error.message });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setFeedback({ kind: "success", message: "Password updated. Your vault is secured." });
    onNotice("Password updated");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    onClose();
    if (error) {
      onNotice(`Could not lock the vault: ${error.message}`);
      return;
    }
    onSignedOut?.();
  };

  const inviteUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteBusy(true);
    setInviteFeedback(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setInviteBusy(false);
    if (!response.ok) {
      setInviteFeedback({
        kind: "error",
        message: payload.error ?? "Invitation could not be sent.",
      });
      return;
    }
    setInviteEmail("");
    setInviteFeedback({
      kind: "success",
      message: "Invitation sent. The recipient can use the magic link to enter the archive.",
    });
    onNotice("Invitation sent");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ios-safe-overlay fixed inset-0 z-50 bg-background/80 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Account control panel"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className="ios-dialog-panel glass-panel mx-auto my-auto flex w-full max-w-4xl flex-col overflow-y-auto"
          >
            <header className="flex items-start justify-between gap-5 border-b border-border p-6 sm:p-8">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-primary">
                  Chico’s control room
                </p>
                <h2 className="mt-3 font-display text-4xl font-light sm:text-5xl">
                  Account settings
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Manage access, keep the original untouched, and stay in control of the archive.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close account control panel"
                onClick={onClose}
              >
                <X />
              </Button>
            </header>

            <section className="mx-4 mt-4 glass-card p-5 sm:mx-8 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="size-4 text-primary" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
                      Storage
                    </p>
                    <h3 className="mt-1 text-base font-medium">Your archive usage</h3>
                  </div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  R2 primary
                </span>
              </div>
              <div
                aria-live="polite"
                className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-5"
              >
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    Used
                  </p>
                  <p className="mt-2 text-lg text-foreground">
                    {statsBusy
                      ? "…"
                      : statsError
                        ? "Unavailable"
                        : formatBytes(stats?.totalBytes ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    Original videos
                  </p>
                  <p className="mt-2 text-lg text-foreground">
                    {statsBusy
                      ? "…"
                      : statsError
                        ? "Unavailable"
                        : formatBytes(stats?.originalBytes ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    Uploads
                  </p>
                  <p className="mt-2 text-lg text-foreground">
                    {statsBusy ? "…" : statsError ? "Unavailable" : (stats?.itemCount ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    Backup
                  </p>
                  <p className="mt-2 text-lg text-foreground">
                    {statsBusy
                      ? "…"
                      : statsError
                        ? "Unavailable"
                        : formatBytes(stats?.b2Bytes ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    Remaining
                  </p>
                  <p className="mt-2 text-lg text-foreground">
                    {statsBusy
                      ? "…"
                      : statsError
                        ? "Unavailable"
                        : stats?.remainingBytes === null || stats?.remainingBytes === undefined
                          ? "Not set"
                          : formatBytes(stats.remainingBytes)}
                  </p>
                </div>
              </div>
              {stats && stats.storageLimitBytes === 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Storage capacity has not been configured yet. Used space is live; remaining space
                  will appear after the archive quota is set.
                </p>
              )}
            </section>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-8">
              <section className="glass-card p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-primary" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
                      Identity
                    </p>
                    <h3 className="mt-1 text-base font-medium">Email address</h3>
                  </div>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">Current address</p>
                <p className="mt-1 truncate text-sm text-foreground">
                  {email || "Loading account…"}
                </p>
                <form onSubmit={updateEmail} className="mt-5 space-y-3">
                  <label className="sr-only" htmlFor="new-email">
                    New email address
                  </label>
                  <input
                    id="new-email"
                    name="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="new@address.com"
                    className="w-full rounded-lg border border-border bg-background/40 px-3 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={emailBusy || !newEmail || newEmail === email}
                    variant="outline"
                    className="w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {emailBusy ? "Requesting change…" : "Change email"}
                  </Button>
                </form>
              </section>

              <section className="glass-card p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <KeyRound className="size-4 text-primary" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
                      Security
                    </p>
                    <h3 className="mt-1 text-base font-medium">Password</h3>
                  </div>
                </div>
                <form onSubmit={updatePassword} className="mt-6 space-y-3">
                  <label className="sr-only" htmlFor="new-password">
                    New password
                  </label>
                  <input
                    id="new-password"
                    name="new-password"
                    autoComplete="new-password"
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                    className="w-full rounded-lg border border-border bg-background/40 px-3 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
                  />
                  <label className="sr-only" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    autoComplete="new-password"
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-border bg-background/40 px-3 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={passwordBusy || !newPassword || !confirmPassword}
                    className="w-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_var(--primary-glow)] hover:bg-primary hover:text-primary-foreground"
                  >
                    {passwordBusy ? "Securing…" : "Update password"}
                  </Button>
                </form>
              </section>

              <section className="glass-card p-5 sm:col-span-2 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserPlus className="size-4 text-primary" />
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
                        People with access
                      </p>
                      <h3 className="mt-1 text-base font-medium">Invite viewers and editors</h3>
                    </div>
                  </div>
                  <span className="border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-primary">
                    Magic link
                  </span>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Send a Supabase magic-link invitation without exposing an admin key in the
                  browser. Only a developer account can send invitations.
                </p>
                <form
                  onSubmit={inviteUser}
                  className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]"
                >
                  <input
                    required
                    type="email"
                    name="invite-email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    aria-label="Invite email address"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="viewer@studio.com"
                    className="min-w-0 rounded-lg border border-border bg-background/30 px-3 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
                  />
                  <select
                    aria-label="Invite role"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as "viewer" | "editor")}
                    className="ocean-select min-w-0 w-full"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={inviteBusy || !inviteEmail}
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {inviteBusy ? "Sending…" : "Send invite"}
                  </Button>
                </form>
                {inviteFeedback && (
                  <p
                    role={inviteFeedback.kind === "success" ? "status" : "alert"}
                    aria-live={inviteFeedback.kind === "success" ? "polite" : "assertive"}
                    className={`mt-3 text-xs leading-5 ${inviteFeedback.kind === "success" ? "text-primary" : "text-destructive"}`}
                  >
                    {inviteFeedback.message}
                  </p>
                )}
              </section>
            </div>

            <footer className="flex flex-col gap-4 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" /> Supabase-secured account controls
              </div>
              <Button
                variant="ghost"
                onClick={signOut}
                className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive sm:justify-center"
              >
                Lock vault
              </Button>
            </footer>
            {feedback && (
              <div
                role={feedback.kind === "success" ? "status" : "alert"}
                aria-live={feedback.kind === "success" ? "polite" : "assertive"}
                className={`mx-6 mb-6 flex items-start gap-2 rounded-lg border p-3 text-xs leading-5 sm:mx-8 ${feedback.kind === "success" ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
              >
                {feedback.kind === "success" ? (
                  <Check className="size-4" />
                ) : (
                  <X className="size-4" />
                )}
                {feedback.message}
              </div>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
