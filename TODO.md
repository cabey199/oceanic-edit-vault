# Oceanic Archive Delivery Tasks

- [ ] **Account control panel:** authenticated owner can open a smooth glassmorphism control panel from the vault, change email through Supabase Auth, change password through Supabase Auth, see clear pending/success/error feedback, and sign out without losing the existing archive experience.
- [~] **User invitations and roles:** the initial Supabase schema and RLS role contract are now drafted; the server-side invite endpoint and panel actions remain to be connected.
- [~] **Real local video compression:** the FFmpeg WASM dependency and reusable compression engine are now in place; the upload drawer still needs to be wired to the engine with cancellation and upload handoff.
- [ ] **Original-quality downloads:** each successful upload preserves the untouched original and creates a separate playback derivative; playback uses the derivative and downloads use the original object and metadata.
- [ ] **Dual storage:** R2 and B2 receive files through short-lived server-issued presigned URLs, with provider fallback, cleanup for failed uploads, and server-only credentials.
- [ ] **Live storage metrics:** control panel and developer vault show total used/free capacity, R2/B2 breakdown, original/playback usage, and current video count from persisted metadata rather than placeholders.
- [ ] **Secret developer backdoor:** the Cat trigger remains available in the archive, but the developer dashboard and admin route require an authenticated developer role and do not rely on obscurity alone.
- [ ] **Quality baseline:** build, lint, and tests pass; the app remains responsive on mobile Safari/Chrome and Cloudflare output remains deployable.
