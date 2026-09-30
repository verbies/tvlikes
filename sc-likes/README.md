# My Likes (anonymous)
Shows and shuffles the public likes of a SoundCloud profile (default https://soundcloud.com/vetb/likes; change it in `credentials.txt`). No credentials, no sign-in, nothing to configure.
`npm i && npm run dev` · `npm test` · `npm run build && npm start` (Node 18+; deploy to any Node host; static hosts won't work because the server fetches SoundCloud).

## How it works (and the caveats)
- SoundCloud's official API always requires a registered app, so it is NOT used. The server instead reads the public likes page the way a browser does: it takes the profile id from the page's embedded data, finds the public web-player client id in the site's own scripts, and pages `api-v2 .../track_likes` (200 per page) following `next_href` until absent.
- This is unofficial. It can break whenever SoundCloud changes its site, and it may conflict with SoundCloud's terms of use. Use it for personal purposes only.
- If SoundCloud answers 403/captcha, the app stops and says so. It never tries to bypass anti-bot or access controls, and never shows fake tracks.
- Playback uses SoundCloud's official embedded Widget (anonymous). Blocked tracks are listed but skipped by shuffle; preview tracks are labelled. No audio is downloaded or stored; every row links back to SoundCloud.
- The UI shows the SoundCloud-reported total when available and flags any shortfall.
- Not verified against the live site (I had no network access when writing this).

## Configuration
- **API keys (optional):** open `credentials.txt`, paste your Client ID and Client secret after `CLIENT_ID=` and `CLIENT_SECRET=`, save. The file is read fresh on every load, so no restart is needed. It stays on the server, is git-ignored, and is never sent to the browser. Blank = public-page route only.
- **Whose likes (editable):** set `PROFILE_URL=` in `credentials.txt` (full link, `soundcloud.com/name`, or just the username; a trailing `/likes` is fine). Read fresh on every load, no restart. On Vercel use the `SOUNDCLOUD_PROFILE_URL` environment variable. The profile's likes must be public.
- No keys are included in this project.
- The server loads `soundcloud.com/vetb` via the official API when keys exist (every `next_href` page), otherwise/if that fails via the public-page route. **Retry official API** re-attempts the official route.
- **Appearance** (top right): theme, accent color, roundness, density.
- Run: `npm i && npm run dev`.


## Deploying on Vercel
- The `api/` folder holds Vercel serverless functions (same code as the local server, in `server/core.mjs`), so `/api/likes`, `/api/settings` and `/api/diagnose` work on Vercel. Build command `npm run build`, output `dist` (auto-detected for Vite).
- `credentials.txt` is local-only and is NOT deployed. On Vercel go to Project → Settings → Environment Variables, add `SOUNDCLOUD_CLIENT_ID` and `SOUNDCLOUD_CLIENT_SECRET` (leave the public/client-exposed options off), then **redeploy**.
- The public-page route may be blocked when requests come from cloud IPs; the official API keys are the reliable option there.
