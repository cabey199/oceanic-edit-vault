import React, { useState, useEffect } from 'react';

export function StealthConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  // 1. Desktop Trigger: Secret Word Sequence ("abyss")
  useEffect(() => {
    let keyBuffer = '';
    const secretCode = 'abyss';

    const handleKeyDown = (e: KeyboardEvent) => {
      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-5);
      
      if (keyBuffer.endsWith(secretCode)) {
        setIsOpen((prev) => !prev);
        keyBuffer = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Mobile Trigger: 10 Taps in 3 Seconds
  useEffect(() => {
    if (tapCount >= 10) {
      setIsOpen(true);
      setTapCount(0);
      return;
    }

    const timer = setTimeout(() => {
      if (tapCount > 0) setTapCount(0);
    }, 3000);

    return () => clearTimeout(timer);
  }, [tapCount]);

  const handleInvisibleTap = () => {
    setTapCount((prev) => prev + 1);
  };

  if (!isOpen) {
    return (
      <div 
        onClick={handleInvisibleTap}
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '60px',
          height: '60px',
          zIndex: 9999,
          opacity: 0,
          cursor: 'default'
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-lg w-full text-slate-100 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-cyan-400 font-mono">⚡ Ghost Admin Console</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-sm bg-slate-800 px-3 py-1 rounded-lg"
          >
            Close (Esc)
          </button>
        </div>
        
        <p className="text-xs text-slate-400 font-mono mb-4">
          Status: <span className="text-emerald-400">Connected (Stealth Mode)</span> | Zero Trace Active
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
            <p className="text-slate-300">System Storage: Active Cloudflare R2 Bucket</p>
            <p className="text-slate-300">Database Auth: Supabase Anon Connected</p>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-400">
            * Memory-only console state. Zero local storage flags or persistent audit entries.
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(false)}
          className="mt-6 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition-all"
        >
          Disappear
        </button>
      </div>
    </div>
  );
}