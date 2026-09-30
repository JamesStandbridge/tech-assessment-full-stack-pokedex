# 12. Show the species as a constellation drawn on the GPU

- Status: accepted
- Date: 2026-09-30

## Context and problem statement

A search box above a list of cards answers the four needs, but it reads as
every other search page and hides what the dataset is: 151 species related by
stats, types, moves, abilities and weathers. The interface should show that
whole at once and let each query reshape it, while keeping the accessible
list of SYS-A11Y-001, the budgets of ADR 11, and the scenarios of `specs/ui`.

## Considered options

1. Scene: a constellation of species, a network of every entity, or a
   landscape of habitats.
2. Graphics: three.js with its WebGPU renderer and TSL, raw WebGPU with WGSL
   and a separate WebGL2 path, or React Three Fiber.
3. Thread: the page's main thread, or a module worker on an
   `OffscreenCanvas`.

## Decision outcome

A constellation of the 151 species, drawn by three.js `WebGPURenderer` with
compute shaders written in TSL, in a module worker on an `OffscreenCanvas`.

- **Placement.** A classical multidimensional scaling of normalized base stats
  and one-hot types gives every species a fixed position, computed by a pure
  function of `domain`, so the same species sit in the same place on every
  visit and in every test.
- **One view per reading.** A pure function turns a search response into
  targets: the best match flies to the front for a name, results line up on
  the axis of the ranking stat for criteria, carriers gather around the move
  or ability they act through for an effect, and Pokémon form rings of setter,
  benefit and drawback around the weather, which also drives a particle
  simulation. Everything else falls back into dust.
- **GPU work.** A compute shader integrates the springs that move every star
  to its target, animates the filaments of relations, and simulates the
  weather particles; the main thread only sends targets and the camera goal.
- **The page stays the source of truth.** Every element the scene labels
  exists in a `figure` named Constellation as a button placed over its star,
  with its relations and highlight as attributes; the results panel beside
  the scene keeps the sections, articles, meters and reasons of ADR 10. The
  canvas is `aria-hidden`.
- **Fallbacks.** Without WebGPU, three.js draws with WebGL2. Without either,
  when the first second of frames runs under 24 per second, when the context
  is lost, or when the user prefers reduced motion or reduced data, a still
  SVG map of the same positions and the same buttons replaces the canvas
  (SYS-UI-025).

### Measurements of the spike

| Measure | Value |
|---|---|
| `three/webgpu` and `three/tsl`, minified, gzip | 246 kB |
| Same, brotli | 198 kB |
| 100,000 particles moved by a compute shader, Chrome on an Apple M-series laptop | 95 frames per second, WebGPU |
| Same, headless Chromium | WebGL2 on software rendering, 1 frame per second |

## Consequences

- The scene chunk is 246 kB gzip, above what the initial budget could carry;
  loading it in a worker after the first paint keeps its parsing off the main
  thread, so Total Blocking Time and Largest Contentful Paint are unaffected.
  It has its own `size-limit` entry of 260 kB gzip.
- Messages between the page and the worker are the only coupling: targets,
  camera goals and pointer events go in, label positions and picks come out,
  each typed by one union with an exhaustive `switch`.
- Headless browsers usually get the still map, so the scenarios exercise the
  accessible layer both renderers share, and the renderer itself is checked by
  a smoke scenario and screenshots.
- `d3-force` and the SVG relation graph of ADR 9 are removed; the weather
  reading is one of the constellation's views.
