# Cybertruck — Interactive 3D

> A cinematic, scroll-driven product experience for the Tesla Cybertruck, rendered live in the browser with React, Three.js and GSAP.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r169-000000?logo=threedotjs&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-8.17-000000)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02?logo=greensock&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Project Objectives](#project-objectives)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [UI/UX Design](#uiux-design)
- [Project Architecture](#project-architecture)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Screenshots & Preview](#screenshots--preview)
- [Video Presentation](#video-presentation)
- [Performance & Optimization](#performance--optimization)
- [Responsive Design](#responsive-design)
- [Security](#security)
- [Future Improvements](#future-improvements)
- [Author](#author)
- [License](#license)

---

## Overview

**Cybertruck — Interactive 3D** is a single-page automotive showcase. Instead of photographs and pre-rendered video, every image of the truck on the page is a **live WebGL render** of a procedurally built Cybertruck model.

The page is structured like a film. Scrolling plays a 12-chapter *teardown*: the truck emerges from a dark garage, rotates into profile, opens its doors and frunk, lifts its body off the battery-and-motor skateboard, and then cuts to close-ups of the wheels, the drive unit and the vault. The sequence is followed by an editorial gallery, a highlights carousel, a range estimator and an interactive specifications explorer.

The project is a **fan-made concept** and is not affiliated with or endorsed by Tesla, Inc. All figures shown on the site are approximate and presented for illustration only.

---

## Project Objectives

- **Cinematic storytelling:** present the vehicle as a scroll-scrubbed film with deliberate camera work, lighting changes and transitions.
- **Real 3D, no media files:** model, materials, environment lighting and textures are generated in code; no 3D models, HDRIs or images are downloaded.
- **Interactive exploration:** let visitors rotate the truck, inspect components, restyle it and compare data rather than only read about it.
- **Useful content:** turn the specifications into tools (unit conversion, trim comparison, a range estimate for real driving conditions).
- **Production quality:** accessible, bilingual, responsive and resilient when WebGL or browser storage is unavailable.

---

## Features

### 3D experience

| Feature | Description |
|---|---|
| **Procedural Cybertruck** | Real-world scale (≈ 5.7 m) model built from extruded profiles: tapered greenhouse, angular wheel arches, light bar, tail bar, glass, mirrors, four opening doors, frunk and retractable tonneau. |
| **Skateboard chassis** | Battery pack, one front and two rear motors, half-shafts and air-suspension corners revealed in the exploded view. |
| **Detailed wheels** | 35″ all-terrain tyres with instanced tread blocks, multi-spoke rims, drilled brake discs, calipers and removable hexagonal aero covers. |
| **Teardown film** | 12 scroll-scrubbed chapters with dark-to-studio lighting intro, doors/frunk opening, exploded view and component close-ups. |
| **Scrambled-word wipes** | Diagonal dark wipes (“Wheels”, “Drive unit”, “Vault”) that hide cuts between 3D sets. |
| **Callout cards** | Specification panels with a leader line that tracks a projected point on the moving truck. |
| **Drag to rotate** | Drag or swipe horizontally to spin the hero truck, with inertia and a glide back to the scripted pose. |
| **Live gallery renders** | Every “photo” in the lower sections is a live render that turns toward the pointer on hover. |

### Product features

| Feature | Description |
|---|---|
| **Search** | Command palette (`Ctrl/⌘ K` or `/`) covering sections, teardown chapters, highlights, specs and actions; accent-insensitive, keyboard-navigable. |
| **Garage** | Saved builds (apply, share, delete with confirmation and *Undo*) and bookmarks of highlights, features and specs. |
| **Configurator** | Exterior finish for every truck on the page (five presets plus a custom colour), site accent palette and graphics quality. |
| **Specs explorer** | Category filters, text search, sorting, AWD vs Cyberbeast comparison, tooltips and deep-link highlighting. |
| **Range estimator** | Speed, temperature, load and aero covers produce an estimated range, efficiency, 10 → 80 % charge time and the biggest limiting factor. |
| **English / French** | Auto-detected from the browser and switchable; also updates `<html lang>`, the page title and meta description. |
| **Imperial / metric** | One specification registry feeds every number on the site. |
| **Dark / light theme** | Switchable at any time; the studio stage and dark-glass panels keep their identity. |
| **Share links** | `?finish=…&palette=…` opens the page with a build applied, then cleans the address bar. |
| **Feedback** | Toast notifications (with *Undo*), accessible confirmation dialogs, tooltips and empty states. |
| **Help** | In-app guide to exploring the page and a list of keyboard shortcuts. |

### Keyboard shortcuts

| Keys | Action |
|---|---|
| `Ctrl` / `⌘` + `K`, `/` | Open search |
| `G` | Open the Garage |
| `C` | Open the configurator |
| `T` | Toggle dark / light theme |
| `?` | Show help & shortcuts |
| `Esc` | Close any panel |

---

## Technologies Used

| Technology | Version | Role |
|---|---|---|
| [React](https://react.dev) | 18.3.1 | UI components and state-driven rendering |
| [Vite](https://vitejs.dev) | 6.0.7 | Development server, bundling and code splitting |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 4.3.4 | React Fast Refresh and JSX transform |
| [Three.js](https://threejs.org) | 0.169.0 | WebGL rendering, geometry, materials, PMREM environment |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | 8.17.10 | Declarative Three.js scene graph in React |
| [@react-three/drei](https://github.com/pmndrs/drei) | 9.114.0 | `View` (multi-viewport rendering), cameras, contact shadows |
| [GSAP](https://gsap.com) | 3.12.5 | Timelines, ScrollTrigger scrubbing, ScrollTo, micro-interactions |
| [Zustand](https://github.com/pmndrs/zustand) | 4.5.5 | Global state with `persist` middleware (localStorage) |
| Google Fonts | — | *Inter* (UI and display) and *JetBrains Mono* (labels and data) |

No CSS framework, UI kit, icon font or i18n library is used: styling is hand-written CSS with design tokens, icons are inline SVG, and translations use a small in-house dictionary module.

---

## UI/UX Design

**Visual identity.** A minimalist, editorial automotive language: a warm-white photo studio for the 3D stage, deep graphite for the content sections, hairline dividers, thin display type (Inter 200–300) paired with monospaced uppercase labels.

**Design system.** All colours, type sizes, spacing, radii and motion durations are CSS custom properties (`src/styles/global.css`). The configurator’s accent palettes and the light theme work by swapping tokens, not by restyling components.

**Motion principles.**

- One easing family (`expo` / custom cubic-béziers) across the site for a consistent feel.
- Scroll-linked motion is *scrubbed* (tied to the scrollbar), while UI feedback is short and time-based.
- Text enters through masked character and word reveals; 3D frames are uncovered by a “shutter” as they scroll in.
- Every animation has a reduced-motion fallback.

**Interaction details.** Custom cursor with contextual labels (*Drag*, *Rotate*), magnetic buttons, rolling link text, glowing frame borders, an auto-hiding navigation bar with a sliding active marker, and a curtain transition when jumping between distant sections.

**Accessibility.**

- Skip link, visible focus rings and semantic landmarks.
- Dialogs with focus trapping, `Esc` to close and focus restoration.
- ARIA roles for the carousel, radio groups, switches, listbox search results and live toast regions.
- Full keyboard support, including carousel arrows and search navigation.
- `prefers-reduced-motion` respected throughout; the custom cursor and magnetic effects are disabled on touch devices.

---

## Project Architecture

```
┌─────────────────────────────── DOM (React) ────────────────────────────────┐
│  Nav · Anatomy (sticky stage + overlays) · Showcase sections · Panels      │
│  Toasts · Dialogs · Cursor · Curtain transition                            │
└──────────────┬──────────────────────────────────────────────┬──────────────┘
               │ GSAP ScrollTrigger writes                      │ <View> tracks DOM rects
               ▼                                                ▼
     ┌───────────────────┐   read every frame   ┌──────────────────────────────┐
     │  stage (lib/stage)│ ───────────────────▶ │  One fixed, transparent      │
     │  plain mutable    │                      │  WebGL <Canvas> behind the   │
     │  object           │                      │  page: hero stage + gallery  │
     └───────────────────┘                      │  views, scissor-rendered     │
                                                └──────────────────────────────┘
     ┌──────────────────────────── Zustand store ─────────────────────────────┐
     │  preferences · builds · bookmarks · panels · toasts · dialogs          │
     │  persisted to localStorage (key: "cybertruck-3d")                      │
     └────────────────────────────────────────────────────────────────────────┘
```

Key decisions:

- **A single WebGL context.** The hero stage and every gallery card are drei `<View>`s rendered into one fixed canvas behind the DOM. Text and controls can therefore sit *over* the 3D, and off-screen views are skipped automatically.
- **Scroll is a timeline.** `lib/stage.js` declares the shots, and `Anatomy.jsx` turns them into one GSAP ScrollTrigger timeline that tweens a plain `stage` object. The R3F render loop reads that object every frame, so scrolling never re-renders React.
- **Single sources of truth.** All numbers come from `lib/specs.js`, all copy from `lib/i18n.js`, and all user actions (theme, language, units, builds, bookmarks, sharing) from `lib/actions.js`, which is shared by the nav, search, shortcuts and panels.
- **Shared materials.** One set of materials is used by every truck instance, so a finish change morphs the whole page at once.

---

## Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | `^18.0.0`, `^20.0.0` or `>= 22.0.0` (required by Vite 6) |
| npm | Bundled with Node.js |
| Browser | A modern browser with WebGL enabled |

### Install dependencies

```bash
git clone <your-repository-url>
cd cybertruck-3d
npm install
```

---

## Getting Started

### Development server

```bash
npm run dev
```

The site is served at **http://localhost:5180** (the server also listens on the local network, see [Configuration](#configuration)).

### Production build

```bash
npm run build
```

The optimised output is written to `dist/`.

### Preview the production build

```bash
npm run preview
```

### Available scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start the development server with hot reloading |
| `build` | `vite build` | Create an optimised production build in `dist/` |
| `preview` | `vite preview` | Serve the production build locally |

---

## Project Structure

```
cybertruck-3d/
├── index.html                  # HTML shell, fonts, meta tags
├── package.json
├── vite.config.js              # Dev server port, build target, chunk splitting
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Page composition, panels, global hooks
    ├── components/
    │   ├── three/              # WebGL layer
    │   │   ├── Scene.jsx         # Fixed transparent canvas + View port
    │   │   ├── MainStage.jsx     # Hero scene: camera, lighting fade, leader line
    │   │   ├── Cybertruck.jsx    # Truck model, pose-driven (doors, explode, …)
    │   │   ├── Wheel.jsx         # Tyre, rim, brake, aero cover
    │   │   ├── Chassis.jsx       # Battery pack, motors, suspension
    │   │   ├── Sets.jsx          # Isolated wheel and drive-unit sets
    │   │   ├── ShowcaseView.jsx  # Live “photograph” for gallery cards
    │   │   └── common.jsx        # Shared environment setup
    │   └── ui/                 # DOM layer
    │       ├── Anatomy.jsx       # Sticky stage, intro, scroll film, callouts
    │       ├── Showcase.jsx      # Overview, highlights, performance, footer
    │       ├── Data.jsx          # Range estimator and specs explorer
    │       ├── Panels.jsx        # Search palette, Garage, Help
    │       ├── Overlays.jsx      # Modal, confirm dialog, toasts, tooltip, bookmark
    │       ├── Chrome.jsx        # Loader, navigation, mobile menu, backdrop
    │       ├── Customizer.jsx    # Configurator drawer
    │       ├── Cursor.jsx        # Custom cursor and magnetic elements
    │       ├── Transition.jsx    # Curtain navigation between sections
    │       ├── SplitText.jsx     # Accessible split-text for reveals
    │       ├── Icon.jsx          # Inline SVG icon set
    │       └── ErrorBoundary.jsx # Contains 3D scene failures
    ├── hooks/
    │   ├── useAppEffects.js    # Document prefs, shortcuts, boot checks
    │   └── useThemeVars.js     # Accent palette and finish morphing
    ├── lib/
    │   ├── cybertruckGeometry.js # Procedural geometry and textures
    │   ├── materials.js        # Shared materials
    │   ├── studioEnv.js        # Procedural studio environment map
    │   ├── stage.js            # Teardown shots and callout definitions
    │   ├── specs.js            # Spec registry, units, range model
    │   ├── i18n.js             # EN / FR dictionaries and helpers
    │   ├── actions.js          # Shared user actions
    │   ├── navigate.js         # Deep links to sections, chapters, items
    │   ├── presets.js          # Finishes and accent palettes
    │   ├── device.js           # Graphics-tier detection
    │   ├── interaction.js      # Pointer, drag and motion preferences
    │   └── overlay.js          # DOM handles used by the render loop
    ├── store/
    │   └── useExperience.js    # Zustand store with persistence
    └── styles/
        └── global.css          # Design tokens, components, themes, breakpoints
```

---

## Configuration

The project needs **no environment variables or API keys**. Behaviour is configured in source:

| What | Where | Notes |
|---|---|---|
| Dev server port and host | `vite.config.js` | Port `5180`, `host: true` (reachable on the local network) |
| Build target and chunks | `vite.config.js` | `es2020`; `three`, `r3f` and `gsap` split into separate chunks |
| Exterior finishes, accent palettes | `src/lib/presets.js` | Colours and material properties |
| Specifications and trims | `src/lib/specs.js` | Values per trim, unit kinds, range-model coefficients |
| Teardown shots and callouts | `src/lib/stage.js` | Camera, pose and card per chapter |
| Copy and translations | `src/lib/i18n.js` | `en` and `fr` dictionaries |
| Graphics tiers | `src/lib/device.js` | Device-pixel-ratio range for `low`, `medium`, `high` |
| Design tokens and themes | `src/styles/global.css` | `:root` tokens and `[data-theme='light']` overrides |

### Persistence

Language, theme, units, finish, palette, graphics tier, saved builds and bookmarks are stored in the browser’s `localStorage` under the key **`cybertruck-3d`**. If storage is blocked, the site falls back to in-memory storage and informs the user.

### Share-link parameters

| Parameter | Example | Accepted values |
|---|---|---|
| `finish` | `?finish=cyber-red` | A finish id from `presets.js` |
| `palette` | `&palette=volt` | A palette id from `presets.js` |
| `color` | `&color=9aa0a8` | Six-digit hex, used with `finish=custom` |

---

## Screenshots & Preview

No screenshots are included in the repository yet. To preview the project, run it locally (see [Getting Started](#getting-started)).

To add screenshots, place images in a `docs/screenshots/` folder and reference them here, for example:

```markdown
![Teardown film](docs/screenshots/teardown.png)
```

---

## Video Presentation

No video presentation is included in the repository yet. The motion design of the teardown film follows a reference product-showcase reel, adapted from a sports car to the Cybertruck.

---

## Performance & Optimization

- **Code splitting.** The WebGL canvas is lazy-loaded, and `three`, the React Three Fiber stack and GSAP ship as separate, cacheable chunks.
- **No asset downloads.** Geometry, materials, the studio environment map (baked once with PMREM) and textures are generated at runtime, and the environment is shared by every view.
- **One GL context, many views.** Gallery renders share a single canvas; views outside the viewport are skipped, and gallery contact shadows are rendered once.
- **Render-free animation.** Scroll and pointer state live in plain mutable objects read by the render loop, not in React state.
- **Instancing and reuse.** Tyre tread blocks are instanced meshes; geometry and materials are built once and shared by every truck.
- **Adaptive quality.** The initial graphics tier is chosen from screen size, CPU cores, device memory and input type, and can be changed in the configurator.
- **Resilience.** Boot timeouts ensure the page never stays locked if the GPU stalls; an error boundary contains scene failures.

Production build output (`npm run build`):

| Chunk | Size | Gzip |
|---|---|---|
| `three` | 683.42 kB | 176.10 kB |
| `r3f` (fiber + drei) | 290.57 kB | 94.04 kB |
| `index` (application) | 185.79 kB | 65.14 kB |
| `gsap` | 69.81 kB | 27.64 kB |
| `index.css` | 45.99 kB | 10.38 kB |
| `Scene` (lazy) | 0.74 kB | 0.47 kB |

---

## Responsive Design

The layout is fluid (`clamp()`-based type and spacing) with dedicated adjustments at these breakpoints:

| Breakpoint | Adaptations |
|---|---|
| `≤ 1100 px` | Model label in the navigation is hidden to make room for actions |
| `≤ 1024 px` | Hero specification strip is hidden |
| `≤ 900 px` | Estimator and help dialogs switch to a single column; toolbar controls stretch |
| `≤ 820 px` | Navigation actions move into a full-screen mobile menu; the gallery stacks; callouts reposition; the configurator becomes a bottom sheet; toasts span the screen |
| `≤ 600 px` | Section links live only in the menu; the spec comparison becomes a stacked layout |
| `≤ 480 px` | Overview highlight list collapses to one column |

Touch devices get dedicated behaviour: horizontal swipes rotate the truck while vertical swipes keep scrolling, gallery trucks sway gently instead of reacting to hover, and press states replace hover-only effects. On portrait screens, the camera pulls back so the full truck stays in frame.

---

## Security

The project is a static front-end application with a deliberately small attack surface:

- **No backend, accounts, cookies or analytics.** No personal data is collected or transmitted.
- **No secrets.** There are no API keys or environment variables.
- **Local-only storage.** Preferences, builds and bookmarks stay in the visitor’s browser.
- **Validated URL input.** Share-link parameters are checked against known finish and palette ids and a strict hex pattern before use, and are removed from the address bar after being applied.
- **No raw HTML injection.** The source does not use `dangerouslySetInnerHTML`, `innerHTML` or `eval`; text written directly to the DOM uses `textContent`.
- **Minimal third-party requests.** At runtime, the only external requests are to Google Fonts.

---

## Future Improvements

- Swap the procedural truck for a licensed, high-fidelity glTF model with Draco compression while keeping the pose system.
- Add automated tests (unit tests for `specs.js` and `i18n.js`, end-to-end tests for search, Garage and navigation).
- Add more languages, which only requires a new dictionary in `lib/i18n.js`.
- Replace approximate figures with sourced, versioned specification data.
- Add an optional post-processing pass (bloom, ambient occlusion) for high-end devices.
- Add screenshots and a short presentation video to this README.

---

## Author

**Dhia Saied**

---

## License

No license file is included, so all rights are reserved by default. Add a `LICENSE` file to define how others may use this code.

*Tesla and Cybertruck are trademarks of Tesla, Inc. This is an independent, fan-made concept and is not affiliated with or endorsed by Tesla, Inc.*
