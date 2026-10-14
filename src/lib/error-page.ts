export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <style>
      * { box-sizing: border-box; }
      body { font: 15px/1.6 system-ui, -apple-system, sans-serif; background: radial-gradient(ellipse at 50% -5%, #06b6d4 0%, #0f172a 58%, #080f1c 100%); color: #f8fafc; display: grid; place-items: center; min-height: 100vh; min-height: 100dvh; margin: 0; padding: max(1.5rem, env(safe-area-inset-top)) max(1.5rem, env(safe-area-inset-right)) max(1.5rem, env(safe-area-inset-bottom)) max(1.5rem, env(safe-area-inset-left)); }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2.5rem 2rem; background: rgba(25, 40, 65, 0.62); border: 1px solid rgba(103, 214, 238, 0.22); border-radius: 1.25rem; box-shadow: 0 18px 55px rgba(0, 0, 0, 0.36); backdrop-filter: blur(18px); }
      .eyebrow { color: #67d6ee; font: 500 0.65rem/1.4 ui-monospace, monospace; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 0.8rem; }
      h1 { font-size: 1.55rem; font-weight: 400; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
      p { color: #b7c5d7; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.65rem; justify-content: center; flex-wrap: wrap; }
      a, button { min-height: 2.75rem; padding: 0.65rem 1rem; border-radius: 0.7rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease; }
      a:focus-visible, button:focus-visible { outline: 2px solid #67d6ee; outline-offset: 3px; }
      a:active, button:active { transform: scale(0.98); }
      .primary { background: rgba(103, 214, 238, 0.16); color: #a5f3fc; border-color: rgba(103, 214, 238, 0.32); }
      .primary:hover { background: #67d6ee; color: #0f172a; }
      .secondary { background: rgba(15, 23, 42, 0.42); color: #f8fafc; border-color: rgba(148, 163, 184, 0.28); }
      .secondary:hover { background: rgba(103, 214, 238, 0.1); border-color: rgba(103, 214, 238, 0.4); }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important; } }
      @media (max-width: 28rem) { .card { padding: 2rem 1.25rem; } .actions { flex-direction: column; } }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="eyebrow">Connection interrupted</p>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
