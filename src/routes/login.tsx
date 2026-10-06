import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, LogIn, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        navigate({ to: "/" });
      }
    } catch (err) {
      setErrorMsg("Failed to connect to authentication server. Check your Supabase URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ocean-archive relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass-panel w-full max-w-md p-8 sm:p-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_var(--primary-glow)]">
            <Lock className="size-5" />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary">
            Restricted Access
          </p>
          <h1 className="mt-1 font-display text-3xl italic font-light">chico’s POV</h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Authenticate to access the vault
          </p>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 flex items-start gap-3 border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive"
          >
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="access@vault.com"
              required
              className="w-full border border-border bg-card/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-border bg-card/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 border border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.2em] text-primary shadow-[0_0_24px_var(--primary-glow)] hover:bg-primary hover:text-primary-foreground"
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

        <div className="mt-8 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
          Encrypted Connection · Oceanic Edits
        </div>
      </motion.div>
    </main>
  );
}
