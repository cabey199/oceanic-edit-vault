# Oceanic Archive Implementation Plan

## Product outcomes

- Give the authenticated owner a clean, oceanic control panel for account settings, invitations, storage metrics, and developer access.
- Compress uploaded media locally for fast playback while preserving the original object for full-quality downloads.
- Store originals and playback derivatives across Cloudflare R2 and Backblaze B2 through server-issued presigned URLs.
- Preserve the Cat backdoor as a developer entry point, while enforcing a real authenticated developer role behind it.

## Design direction

- **Design movement:** cinematic oceanic glassmorphism: a private deep-water control room rather than a generic admin dashboard.
- **Core principles:** calm hierarchy, luminous status feedback, compact operational controls, and motion that feels tidal rather than bouncy.
- **Color philosophy:** abyssal navy creates privacy and focus; cyan is reserved for trusted actions, healthy systems, and active state; muted slate keeps technical detail quiet.
- **Layout paradigm:** a focused modal control room with a left rail of account sections and a breathing content pane, reusing the archive's floating-panel language.
- **Signature elements:** bioluminescent cyan edge glow, monospace telemetry labels, and restrained glass layers over the ocean background.
- **Interaction philosophy:** every mutation shows a clear pending/success/error state; sensitive actions are explicit and reversible where possible.
- **Animation:** short opacity/translate transitions for panels, soft layout motion for status changes, and no animation that blocks keyboard or mobile use.
- **Typography:** Instrument Serif for editorial headings, Work Sans for controls and body copy, IBM Plex Mono for labels and system telemetry.
- **Brand essence:** a private, beautiful edit vault for a creator who wants the feeling of a studio control room without sacrificing practical file operations. Personality: private, cinematic, precise.
- **Brand voice:** direct and intimate. Example lines: “Keep the original untouched.” “Your archive is calm, connected, and ready.”
- **Wordmark:** the existing lowercase “chico’s POV” wordmark with its cyan live dot remains the primary mark.
- **Signature color:** bioluminescent cyan `#48CAE4`.

## Project structure

- `src/lib/supabase.ts`: one browser Supabase client shared by auth and account features.
- `src/components/AuthGate.tsx`: session gate and shared auth actions.
- `src/components/account-panel.tsx`: account settings, invitation UI, and storage summary presentation.
- `src/components/archive-experiences.tsx`: upload/player/developer vault experiences and existing secret backdoor.
- `src/routes/index.tsx`: archive shell and control-panel entry point.
- `src/routes/admin.tsx`: restricted developer dashboard route; role enforcement will be added with the storage backend.
- `src/server.ts`: server-side presign/invitation/storage endpoints as those capabilities are introduced.
- `supabase/migrations/`: database tables and RLS policies for archive metadata, invitations, roles, and storage accounting.

## Delivery phases

1. **Foundation:** centralize Supabase auth, add the account control-panel shell, and make email/password changes real.
2. **Invitations and roles:** add server-side invitation handling, viewer/editor roles, RLS, and developer-role enforcement.
3. **Media pipeline:** add FFmpeg WASM, metadata extraction, cancel/retry states, original/playback objects, and real video playback/downloads.
4. **Storage:** connect R2 and B2 through server-only credentials, presigned URLs, provider fallback, cleanup, and live storage metrics.
5. **Hardening:** fix tests, add feature coverage, validate mobile memory behavior, and deploy the Cloudflare build.
