import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, KeyRound, Lock, LogIn, Mail, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

type LoginMode = "login" | "forgot" | "reset";

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>("login");
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));
    if (hashParams.get("type") === "recovery") setMode("reset");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => subscription.unsubscribe();
  }, []);

  const clearFeedback = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      else navigate({ to: "/" });
    } catch {
      setErrorMsg("Failed to connect to authentication server. Check your Supabase URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSuccessMsg("If an account exists for that email, a password-reset link is on its way.");
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    if (newPassword.length < 6) {
      setErrorMsg("Use at least 6 characters for the new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("The password confirmation does not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    window.history.replaceState(null, "", "/login");
    await supabase.auth.signOut();
    setMode("login");
    setSuccessMsg("Password updated. You can now sign in with your new password.");
  };

  const showLogin = () => {
    setMode("login");
    clearFeedback();
  };

  const heading =
    mode === "forgot"
      ? "Password Recovery"
      : mode === "reset"
        ? "Create New Passcode"
        : "Restricted Access";
  const subtitle =
    mode === "forgot"
      ? "Request a secure reset link"
      : mode === "reset"
        ? "Choose a new password for your vault"
        : "Authenticate to access the vault";

  return (
    <main className="ocean-archive ios-login-page relative isolate overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)]" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
        className="glass-panel w-full max-w-md p-8 sm:p-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_var(--primary-glow)]">
            <Lock className="size-5" />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary">{heading}</p>
          <h1 className="mt-1 font-display text-3xl italic font-light">chico’s POV</h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {errorMsg && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-xs leading-5 text-destructive"
          >
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
        {successMsg && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-3.5 text-xs leading-5 text-primary"
          >
            {successMsg}
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="access@vault.com"
                required
                className="h-12 w-full rounded-lg border border-border bg-card/50 px-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Passcode
              </label>
              <input
                id="login-password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="h-12 w-full rounded-lg border border-border bg-card/50 px-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                clearFeedback();
              }}
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Forgot password?
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full border border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.2em] text-primary shadow-[0_0_24px_var(--primary-glow)] hover:bg-primary hover:text-primary-foreground"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <span className="flex items-center gap-2">
                  Unlock Vault <LogIn className="size-3.5" />
                </span>
              )}
            </Button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="recovery-email"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Email Address
              </label>
              <input
                id="recovery-email"
                autoComplete="email"
                autoCapitalize="none"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="access@vault.com"
                required
                className="h-12 w-full rounded-lg border border-border bg-card/50 px-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full border border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.2em] text-primary shadow-[0_0_24px_var(--primary-glow)] hover:bg-primary hover:text-primary-foreground"
            >
              {loading ? (
                "Sending reset link..."
              ) : (
                <span className="flex items-center gap-2">
                  Send reset link <Mail className="size-3.5" />
                </span>
              )}
            </Button>
            <button
              type="button"
              onClick={showLogin}
              className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="size-3.5" /> Back to sign in
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handlePasswordReset} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                New Passcode
              </label>
              <input
                id="new-password"
                autoComplete="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                className="h-12 w-full rounded-lg border border-border bg-card/50 px-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                Confirm Passcode
              </label>
              <input
                id="confirm-password"
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="h-12 w-full rounded-lg border border-border bg-card/50 px-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full border border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.2em] text-primary shadow-[0_0_24px_var(--primary-glow)] hover:bg-primary hover:text-primary-foreground"
            >
              {loading ? (
                "Updating passcode..."
              ) : (
                <span className="flex items-center gap-2">
                  Update passcode <KeyRound className="size-3.5" />
                </span>
              )}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
          Encrypted Connection · Oceanic Edits
        </div>
      </motion.div>
    </main>
  );
}
