# Maxim Kurylev — Products & Perspective

Cinematic redesign of the existing GitHub Pages portfolio. Original Russian/English copy, destinations, three routes, theme persistence and language persistence are retained.

## Preview and maintenance

Requires Node.js 22 or newer.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. Edit `experience.css` and `src/`. After JavaScript changes run `npm run build`, then reload. `npm run check` verifies original content and destination parity against `origin/main` (the pre-redesign baseline).

GitHub Pages serves the root `index.html`; the compiled `assets/` are tracked, so production does not require Node or a runtime CDN. The original `portfolio-header.css` remains unchanged. Fonts are self-hosted, with their OFL licenses in `assets/fonts/`.

## Design and interaction

- Original forest-green, mint and warm-gold palette with locally hosted Manrope and Cormorant Garamond.
- Transparent full-width navigation backdrop, expressive editorial Hero, three original portfolio routes.
- Three.js WebGL cubes with transparent shells, lit cores, corner joints, independent rotation, pointer parallax and mouse drag.
- Explore button separates/reassembles the structure; native buttons support keyboard input. Touch keeps native vertical scrolling.
- GSAP / ScrollTrigger entrances, scroll-linked composition and SVG parallax. Three new animated SVG illustrations represent experience, approach and working products.
- Pause control, prefers-reduced-motion support, static SVG fallback, WebGL context-loss fallback.
- Rendering stops outside the viewport and in hidden tabs; mobile pixel ratio capped at 1.4, desktop at 1.7. WebGL loads as a separate chunk. No scroll hijacking, videos, postprocessing or remote font calls.

## Verification

- Build and content/link parity checks passed.
- Browser layout inspected at 320, 390, 768 and 1440 CSS pixels, including English and light theme. No horizontal overflow observed.
- Language, theme, pause, expand/collapse, keyboard Space activation and portfolio anchor checked.
- No browser errors or warnings observed in the checked session.
- All six unique external destinations returned HTTP 200.
- JavaScript transfer budget approximately 182 KiB gzip; servers must enable HTTP compression to realize that transfer size.
- Mobile checks use browser viewport simulation, not physical iOS/Android hardware. Lighthouse/Core Web Vitals and sustained real-device FPS were not measured. Reduced-motion and context-loss paths are implemented but were not exercised through OS/GPU failure simulation.

The award ambition is a design direction; no Awwwards evaluation or award is claimed.
