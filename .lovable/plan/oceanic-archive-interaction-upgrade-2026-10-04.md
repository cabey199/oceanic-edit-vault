# Oceanic Archive interaction upgrade

## Build
- Replace the file picker shortcut with a polished upload drawer supporting drag-and-drop, file selection, simulated upload progress, and compression feedback.
- Add a reusable private developer dashboard with storage analytics, compression controls, and operational status.
- Open that dashboard from the footer cat and expose the same experience at `/admin`.
- Upgrade edit previews into a cinematic viewer with custom playback controls and a one-click camera-roll save action.

## Technical details
- Keep uploads, metrics, and player behavior client-side and simulated, matching the existing showcase architecture.
- Use Framer Motion for drawer, modal, progress, dashboard, and control transitions.
- Add route-specific metadata for `/admin` and verify desktop and mobile interactions.
