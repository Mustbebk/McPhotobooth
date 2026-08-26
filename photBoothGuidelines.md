# Vintage Photobooth Web App — Project Spec

## 1. Overview
A browser-based vintage photobooth app (inspired by mysketchbooth.com) that lets users:
1. Take a series of webcam photos with a retro filter applied
2. Arrange them into a chosen layout
3. Decorate the final composition with pre-made stickers in a drag/resize/rotate editor
4. Export the finished image as a downloadable file

No accounts, no backend, no persistent storage — fully anonymous, session-based, static site.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React + Vite | Fast dev/build, no backend needed |
| Camera capture | Browser `getUserMedia` API | Native, no dependencies |
| Editor canvas | Fabric.js | Strong support for layering, drag/resize/rotate, exporting canvas to image |
| Styling | Tailwind CSS | Fast, consistent styling |
| State | React state/context | App is small enough — no Redux needed |
| Local persistence | `localStorage` (optional) | Only to avoid losing in-progress work on refresh; not a saved history feature |
| Hosting | Static hosting (Vercel/Netlify/GitHub Pages) | No backend to deploy or maintain |

No server, no database, no user accounts.

---

## 3. Color Scheme

| Name | Hex |
|---|---|
| Burgundy | `#43302E` |
| Powder Blue | `#C1DBE8` |
| Buttermilk | `#FFF1B5` |

Use Burgundy as the primary/dark accent (text, buttons, frames), Powder Blue and Buttermilk as soft background/highlight tones. Full UI styling direction (typography, spacing) to be finalized in a later design pass.

---

## 4. App Flow

### 4.1 Landing / Start
- Simple welcome screen with app name, brief description, and "Start" button
- Requests camera permission on start

### 4.2 Capture Step
- User selects:
  - **Layout**: Strip (e.g. 3–4 vertical shots), Grid (e.g. 2x2), or Single photo
  - **Filter**: only the default preset applies (see Section 5) — no filter picker UI needed since there's only one filter
- Countdown timer (e.g. 3-2-1) before each shot
- Captures the number of photos required by the selected layout
- Live camera preview shown throughout

### 4.3 Preview / Compose Step
- Captured shots are automatically arranged into the selected layout
- Default filter is baked into the composed image
- User can retake the full set if unhappy, or proceed to editor

### 4.4 Editor Step (Sticker Decoration)
- Composed photo layout loads as the base image on a Fabric.js canvas
- Sticker panel (sidebar or drawer) displays available stickers as individual selectable elements
- User can:
  - Click/drag a sticker onto the canvas
  - Move, resize, and rotate any placed sticker
  - Delete a placed sticker
  - Layer multiple stickers (bring to front / send to back — stretch goal)
- No text tool, no custom image upload for v1 (pre-made stickers only, per decision below)

### 4.5 Export Step
- "Download" flattens the canvas (base image + stickers) into a single image
- Output format: PNG (primary); JPEG as a secondary option if needed for smaller file size
- No server-side storage — download happens entirely client-side

---

## 5. Filter Spec (Single Default Filter)

Only one filter preset is used app-wide — applied automatically to every capture, no user selection needed.

| Parameter | Value |
|---|---|
| Preset | P5 |
| Exposure | -0.8 |
| Contrast | -1 |
| Sharpen | +1.9 |
| Saturation | +2.5 |
| Shadow | +2.9 |
| Grain | 6.1 |
| Fade | 2.1 |

**Implementation note:** these values map to a specific photo-editing app's adjustment scale, not directly to CSS filters or canvas pixel operations. Before implementation, these will need to be translated into equivalent operations — likely a combination of:
- CSS `filter` (brightness, contrast, saturate) applied to the video/canvas element, and/or
- Canvas pixel manipulation (e.g. via WebGL or a library like `glfx.js` / `CamanJS`) for grain and fade, which aren't native CSS filter properties

This translation/tuning step should happen early, since it affects the whole visual identity of the output.

---

## 6. Stickers

> **IMPORTANT — for the coding agent:** Sticker assets are provided manually by the developer. **Do not generate, download, or create placeholder/synthetic sticker images or artwork under any circumstances.** Build the sticker panel to simply read from `/public/stickers/` using the manifest structure below. If the folder is empty during development, render empty states / placeholder boxes (e.g. gray outlined squares) only — never fabricate actual sticker graphics.

- **Source**: pre-made sticker packs provided by you (PNG/SVG assets) — not user-uploaded
- **Format needed**: each sticker must be an **individual transparent PNG/SVG file**, not a sprite sheet
  - Note: the reference image you shared is a sprite sheet (multiple stickers in one image). These will need to be cut into individual files before being usable in the editor — either manually or with an image-splitting script. Flag this as an asset-prep step before sticker integration begins.
### 6.1 Background-Removal Pipeline

Raw sticker source images may arrive as JPGs with plain/solid backgrounds (not pre-cut transparent PNGs). Rather than removing backgrounds manually per image, build a repeatable pipeline so any new raw image dropped in gets processed automatically.

> **Clarification for the coding agent:** This is image *processing* (background removal) on assets the developer provides — not sticker *generation*. Do not create, alter, or stylize the sticker artwork itself; only strip the background from what's provided.

**Proposed setup:**
- **Input folder**: `/assets/stickers-raw/` — drop raw JPG/PNG files here (organized by pack if desired, e.g. `/assets/stickers-raw/pack-01-celestial/`)
- **Output folder**: `/public/stickers/` — processed transparent PNGs land here, mirroring the input folder structure, ready for the app to read
- **Tool**: a Python script using the `rembg` library (well-suited for soft/glossy edges like the celestial sticker samples) — or a simpler Pillow-based solid-color-key script if backgrounds are consistently plain white
- **Behavior**:
  - Script scans the raw folder for new/unprocessed images (skip files that already have a matching output PNG, so re-runs don't reprocess everything)
  - Outputs transparent PNG with the same base filename
  - Optionally auto-updates `manifest.json` (Section 6) to include newly processed stickers, so no manual JSON editing is needed
- **How to run it**: either as a manual command (`python process_stickers.py`) run whenever you add new raw images, or — if the dev setup supports it — a file-watcher that runs it automatically when new files appear in the raw folder. Start with the manual command version; automate further only if it becomes a hassle.

- **Asset folder structure** (proposed):
  ```
  /public/stickers/
    pack-01-celestial/
      star-pink.png
      star-blue.png
      pearl-large.png
      heart-iridescent.png
      ...
    pack-02-.../
  ```
- Sticker panel in the editor reads from a manifest (JSON) listing available packs/stickers, so new packs can be added without code changes:
  ```json
  {
    "packs": [
      {
        "id": "pack-01-celestial",
        "name": "Celestial",
        "stickers": ["star-pink.png", "star-blue.png", "pearl-large.png"]
      }
    ]
  }
  ```

---

## 7. Non-Goals (v1)

- No user accounts or login
- No saved photo history / gallery
- No custom sticker upload by end users
- No text tool or emoji tool
- No multiple filter options
- No backend/server/database

---

## 8. Build Strategy (Free Tier)

Antigravity's free tier is limited (as low as 20 agent requests/day, refreshing weekly, as of mid-2026). To make the most of it:

- **Batch big chunks per prompt** — ask for a whole flow/feature at once (e.g. "build the entire capture step: camera permission, countdown, multi-shot capture, layout assembly") rather than one small tweak per request.
- **Build in this order** (each bullet ≈ one focused prompt):
  1. Project scaffold (Vite + React + Tailwind, folder structure, routing between steps)
  2. Camera capture step (permission, countdown, multi-shot capture) — no filter yet
  3. Layout assembly (strip/grid/single) using raw captured photos
  4. Filter implementation (Section 5) — isolate this since it may need iteration
  5. Fabric.js canvas + base image loading (editor step, no stickers yet)
  6. Sticker panel + manifest loading + drag/resize/rotate (once you've added real sticker assets)
  7. Export/download step
  8. Polish pass: color scheme (Section 3), spacing, responsive behavior
- **Test locally between prompts** rather than asking the agent to verify every small thing — save requests for actual code changes, not status checks.
- **Write clear, complete prompts** referencing this spec directly (e.g. "per Section 4.2 of the spec...") so the agent doesn't need follow-up clarification requests.
- If you hit the daily/weekly cap, small credit top-ups are cheap and don't require a subscription — cheaper than waiting a full week if you're mid-flow.

---

## 9. Open Items for Later

- Final individual sticker assets (cut from sprite sheets you provide)
- Exact translation of filter parameters (Section 5) into web-implementable operations
- Detailed visual/UI design pass (typography, layout spacing, component styling) using the color scheme in Section 3
- Decide on final export formats (PNG only vs. PNG + JPEG)
