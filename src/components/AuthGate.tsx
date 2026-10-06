import React, { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorMsg(error.message);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Password updated successfully!");
      setNewPassword("");
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono">
        Authenticating abyssal vault...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-cyan-500/20 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">OCEANIC VAULT</h1>
            <p className="text-xs text-slate-400 mt-1">Private Access Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Access Identifier
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="editvault@archive.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2 rounded border border-rose-900/50">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 rounded-lg transition-all text-sm mt-2"
            >
              Unlock Vault
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setIsChangingPassword(!isChangingPassword)}
          className="bg-slate-900/80 backdrop-blur border border-slate-800 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-mono transition-all"
        >
          {isChangingPassword ? "Cancel" : "Change Password"}
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-slate-900/80 backdrop-blur border border-slate-800 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg font-mono transition-all"
        >
          Lock Vault
        </button>
      </div>

      {isChangingPassword && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handlePasswordChange}
            className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full space-y-4"
          >
            <h3 className="text-sm font-semibold text-cyan-400 font-mono">
              Update Account Password
            </h3>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              placeholder="New password (min 6 characters)"
            />
            {errorMsg && <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-emerald-400 font-mono">{successMsg}</p>}
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-1.5 rounded-lg text-sm"
            >
              Save New Password
            </button>
          </form>
        </div>
      )}

      {children}
    </div>
  );
}
