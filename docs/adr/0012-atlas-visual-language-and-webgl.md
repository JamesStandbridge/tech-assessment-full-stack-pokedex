# 12. Present the Pokédex as a naturalist atlas, with WebGL plates

- Status: accepted
- Date: 2026-09-30

## Context and problem statement

The first interface worked but looked generic: a dark navy page, radial
glows, neon pills and a stack of identical rounded cards. Its weather graph
used a force-directed layout, whose positions depended on the simulation
rather than on the data; labels overlapped and the figure had no reading
order. A search product that explains why results match needs a visual
language that carries hierarchy, annotation and comparison, and a strategy
figure that can be read.

## Considered options

- **Naturalist atlas**: printed plates of natural history crossed with the
  data graphics of Tufte: paper, ink, hairlines, annotation.
- **Laboratory instrument**: a dense, monospaced dashboard.
- **Editorial poster**: large type and flat type colours.
- **Pokédex device**: a skeuomorphic handheld.

## Decision outcome

Chosen: the naturalist atlas. It suits a catalogue of species, echoes the
life sciences, and its conventions (numbered specimens, plates, figure keys,
marginal notes, leader lines) are conventions of explanation, which is what
the search results need.

### Visual language

- Paper `#F2ECDF`, ink `#1C1814`, hairline rules instead of shadows and
  rounded cards, and one accent, the Pokédex red, used as the rubric of old
  books: specimen numbers, selection and focus.
- Type colours become watercolour pigments in `oklch`, of lower chroma, used
  as washes rather than fills.
- Three self-hosted families: IM Fell English for specimen names and plate
  titles, Source Serif 4 for text, IBM Plex Mono in letter-spaced small
  capitals for labels, folios and measures. The fashionable pairing of
  Instrument Serif and Geist is avoided on purpose.
- The query is shown as an interlinear gloss: every word underlined and
  annotated with its role, as linguists annotate a sentence.
- Results are registers, dense ruled rows, instead of cards. A criteria
  register places every result on one shared axis, so the distribution is
  read at a glance, and compared profiles are drawn as parallel coordinates,
  whose axes read more accurately than the areas of a radar.

### The strategy figure

The force-directed graph is replaced by a deterministic layered figure, in
the manner of Sugiyama: the weather, then the mechanisms (abilities and
moves) grouped by role, then the Pokémon, ordered by the barycentre heuristic
to reduce crossings. The layout is a pure function of the results, tested for
determinism and crossings; hovering or focusing a node highlights its path and
dims the rest. Force layouts are unstable and uninterpretable at this density
(Krzywinski et al., *Hive plots: rational approach to visualizing networks*,
2012), and ordered layouts outperform them on most reading tasks (Ghoniem,
Fekete and Castagliola, 2005). The `Relations` list stays as the figure's
key, and `d3-force` leaves the dependencies.

### WebGL plates

- The best match and the details draw the official artwork as a line
  engraving whose stroke weight follows luminance, washed with the colour of
  the Pokémon's type, with an ink reveal on first appearance and the original
  colours on hover or focus. A weather search draws its atmosphere behind the
  page: rain as ink strokes, sun as warm grain, sand and hail as particles.
- The shaders are written for OGL (about 8 kB compressed for its core), loaded
  in a separate chunk only when a plate is shown; three.js, above 150 kB, would
  cost more than the whole initial bundle.
- The artwork host answers `Access-Control-Allow-Origin: *`, so images load as
  textures without widening the Content Security Policy.
- Registers keep plain sprites: a WebGL context per row would exhaust the
  browser's limit of contexts.
- The image stays in the document, for assistive technologies and as the
  Largest Contentful Paint; the canvas is decorative and drawn over it once
  the image has loaded. Without WebGL, with reduced motion, with reduced data
  or after a lost context, the plain artwork shows (SYS-UI-024).
- Opening a result morphs it into its details with the View Transitions API,
  unless the user prefers reduced motion (SYS-UI-025).

## Consequences

- Fonts add requests; they are preloaded and their fallbacks are adjusted
  with `size-adjust` so the swap does not shift the layout.
- WebGL code is hard to unit test; the shaders sit behind a small interface
  whose fallback paths are tested, and the interface scenarios check the
  fallbacks in a real browser.
- A second size budget covers the WebGL chunk.
- The accessible contract of the interface is kept, except for deliberate
  renames recorded in the scenarios: the team tray becomes the party, and the
  collectible card becomes a plate.
