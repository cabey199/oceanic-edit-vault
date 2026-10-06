import { AnimatePresence, motion } from "framer-motion";
import { Check, Mail, ShieldCheck, UserPlus, X, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type AccountPanelProps = {
  open: boolean;
  onClose: () => void;
  onNotice: (message: string) => void;
};

type Feedback = { kind: "success" | "error"; message: string } | null;

export function AccountPanel({ open, onClose, onNotice }: AccountPanelProps) {
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

  useEffect(() => {
    if (!open) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? "");
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
    await supabase.auth.signOut();
    onClose();
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
          className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-xl sm:p-8"
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
            className="glass-panel mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-y-auto sm:my-8 sm:max-h-[calc(100vh-4rem)]"
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
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="new@address.com"
                    className="w-full border border-border bg-background/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
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
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                    className="w-full border border-border bg-background/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />
                  <label className="sr-only" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    className="w-full border border-border bg-background/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
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
                    aria-label="Invite email address"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="viewer@studio.com"
                    className="border border-border bg-background/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />
                  <select
                    aria-label="Invite role"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as "viewer" | "editor")}
                    className="border border-border bg-background/30 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
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
                    className={`mt-3 text-xs ${inviteFeedback.kind === "success" ? "text-primary" : "text-destructive"}`}
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
                className={`mx-6 mb-6 flex items-center gap-2 border p-3 text-xs sm:mx-8 ${feedback.kind === "success" ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
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
