# Dodecahedron

An interactive 3D model of the twelve-plane structure at the center of **Hyperrealistic
Relativism** (HR) — a philosophy of perspectival pressure, built and maintained by 白浩.
This repo is a companion tool for the book: a dodecahedron you can rotate, annotate, and
export illustrations from, rather than a static diagram.

## The philosophy, briefly

Hyperrealistic Relativism starts from one claim: no single point of view can explain all
possible events. Not because nothing matters, but because things matter *too much* to be
reduced to one explanation. A theft is survival, violation, desperation, and consequence
all at once — which one it "is" depends on the frame measuring it.

HR is Kabbalah-inspired without depending on Kabbalah. Its structure is a dodecahedron
suspended between two voids:

- **Twelve faces** — the planes: recurring frames through which human beings interpret
  reality. Bias, Ego, Society, World, Order, Reason, Nature, Time, God, Communication,
  Sin, Evolution. Each reveals something and hides something; no plane holds the throne.
- **The interior void (Id)** — the pre-rational push: hunger, fear, desire, survival.
  Pushes outward from the center through all twelve planes at once.
- **The exterior void (SuperEGO)** — inherited judgment, internalized authority, the
  accumulated pressure of every other consciousness pressed into your shape. Surrounds
  the whole structure rather than occupying a face of it.
- **Twenty vertices, thirty edges** — universal in kind, individual in value and
  sharpness. What you'd call your character or your blind spots is the local geometry of
  *your* dodecahedron, not a fixed shape everyone shares.

HR isn't relativism-as-shrug. It ranks frames — not by how certain they feel from inside,
but by what they do under pressure: whether they need to silence the people they affect to
stay stable (the **Testimony Test**), what happens when they govern real consequences (the
**Consequence Test**), and whether they can say in advance what would count as their own
failure (the **Revision Test**). The manuscript itself is versioned rather than declared
finished, on the same principle.

The full manuscript isn't tracked in this repository — it lives and gets revised
elsewhere. This app renders its structure, not its text.

## What's in this app

- **The dodecahedron itself** — twelve pentagonal faces, twenty vertices, thirty edges,
  plus the center point (Id) and an external point (SuperEGO), rendered in Three.js and
  oriented so Bias faces up and Reason faces the viewer on load.
- **Labels & detail panels** — click any face, the center, or the external point to open
  a slide-in panel with that plane's definition, straight from the manuscript. Vertex and
  edge labels are editable/renameable in place.
- **Arrow Mode** — click through any sequence of labels (vertices, edges, faces, Id,
  SuperEGO) to draw a persistent annotation arrow between them. Arrows are saved to
  `localStorage` and survive a reload; right-click one to delete it.
- **Sequence Mode** — select two *adjacent* planes along the book's own pressure-passing
  cycle (`Bias → Ego → Society → World → Order → Reason → Id → Nature → Time → God →
  Communication → Sin → Evolution → SuperEGO → back to Bias`) and export a clean PNG: the
  camera resets to a fixed angle, the two planes highlight gold, everything else fades,
  and an arrow + labels are burned into the downloaded image. Built for generating the
  book's own per-transition illustrations directly from the model — one selection, one
  file, no manual screenshotting.
- **Toggle Labels** — hide all overlay text to inspect the bare geometry.

## Tech stack

- [Svelte 5](https://svelte.dev/) + [SvelteKit](https://kit.svelte.dev/) (static adapter —
  no server, ships as a plain static site)
- [Vite](https://vitejs.dev/) for dev/build
- [Three.js](https://threejs.org/) for the 3D scene, geometry, and `OrbitControls`
- No CSS framework, no state management library — component-local state and a handful of
  Svelte stores drive the 2D label overlay in sync with the 3D scene

## Project structure

```
src/
  lib/
    Dodecahedron.svelte   # the entire app: geometry, scene setup, labels, both modes
  routes/
    +page.svelte           # mounts <Dodecahedron />
    +layout.svelte, +layout.js
  app.html, app.css
```

Everything lives in one component by design — the geometry, the label stores, the arrow
system, and the sequence/export logic are all tightly coupled to the same Three.js scene
graph, so splitting it apart would mean threading that scene graph through props/context
for no real gain at this size.

## Running locally

```bash
npm install
npm run dev       # dev server with HMR
npm run build     # static build to ./build
npm run preview   # serve the production build locally
```

No environment variables, no backend, no database. `npm run build` produces a fully
static site (via `@sveltejs/adapter-static`) that can be hosted anywhere that serves
files.

## Notes on the geometry

Vertex positions are computed directly from the golden ratio (`φ = (1 + √5) / 2`), the
standard construction for a regular dodecahedron. Face and edge adjacency are hardcoded as
index lists rather than derived at runtime, since the vertex ordering is fixed and known
in advance. The initial camera-independent rotation (applied once to the whole geometry
group at mount, not to the camera) exists purely so that Face 1 (Bias) reads as "up" and
Face 6 (Reason) reads as "facing the viewer" by convention — orbiting the camera afterward
never changes that underlying orientation, which is what makes the Sequence Mode PNG
export reproducible: resetting the camera always reproduces the same shot.
