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

- Three independent glass cubes (SYSTEM, BUSINESS, PRODUCT) move within the Hero viewport. Throw velocity, damping, spin from the grab offset, edge bounces and pair collisions use CSS pixels per second.
- Only cube handles receive pointer events. Text repels free cubes; cubes remain draggable over non-selectable Hero copy; overlapping links release pointer interception without fading. The Hero bounds stop throws and bouncing cubes, and the scene stays outside the projects section.
- Mouse drag throws a cube. On touch, hold for 190 ms to grab; an immediate swipe over a handle scrolls the page. Elsewhere scrolling is native. Pointer cancellation, lost capture, blur and hidden tabs release a drag.
- Keyboard: arrow keys move, Shift increases the step, Space spins, Escape resets. Pause stops autonomous motion; reduced-motion preference starts paused. An explicit Resume enables motion.
- WebGL uses glass rim reflections and three restrained mechanisms. A CSS 3D renderer shares the interaction and physics if WebGL is unavailable or lost. The initial SVG remains until initialization completes.
- Compact Hero, section spacing and cards preserve original text and links, bilingual copy, theme and navigation. Mobile body copy remains 16 px.
- WebGL pixel ratio is capped at 1.4 on mobile and 1.7 on desktop. Hidden tabs suspend rendering.

## Verification of this revision

- `npm run build`, `npm run check`, and `node --test scripts/physics.test.mjs` passed. Content and external URL parity are checked against the fetched main branch.
- Five physics tests cover frame-rate consistency, boundary energy loss, collision response, coincident centres and avoidance from inside a text rectangle.
- Browser: desktop drag and pause; 320/390/768 px embedded responsive previews; English/light theme at 390 px; portfolio anchor navigation at 320 px. Measured no horizontal document overflow at 320 and 390 px.
- The verification browser cannot create WebGL: visual and interaction checks exercised the CSS 3D fallback. WebGL visuals and real-device touch gestures remain unverified. No sustained FPS, Core Web Vitals, physical Android or iOS measurements are claimed.

The award ambition is a design direction; no Awwwards evaluation or award is claimed.
