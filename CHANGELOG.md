# Changelog

Prism: a graphing and rendering engine (WebGL2). Tether does its layout and physics. Versions follow
`0.MINOR.PATCH` until the first stable release.

## 0.3.1 (2026-09-30)

Needs Tether 0.3.0 (for `flowOf`); the dependency is `tether#v0.3.0`.

- **Faster restyles with class rules or hooks.** An edge reads its end nodes' resolved styles instead of resolving
  them again. Before, every restyle resolved each node three times.
- **Smooth panning over cards.** New card-text bitmaps are made within 4 ms per frame; past that, a card's text is
  drawn straight onto the layer for that frame. Panning into a crowd of new cards dropped from 31 ms for the first
  frame to about 5 ms. Off-screen cards no longer get bitmaps.
- **Separation of concerns.** Tether says how the graph flows (`flowOf`: where the root lies, the axis levels run
  along, and which way the tree grows). Prism no longer interprets the layout settings for port sides, label
  placement, edge routing or the smart fit.
- **Faster layouts, from Tether.** On the demo, rendering 3,000 nodes went from 1.1 s to 0.69 s, and 10,000 from
  4.1 s to 2.5 s. Floating graphs lay out 8–11× faster and no longer drift after a touch.

## 0.3.0 (2026-09-30)

Card nodes.

- **`nodeLook: "card"`**: wide cards with their text inside, as an alternative to square icons with a label beside
  them (`"icon"`, still the default, drawn exactly as before).
  - Switching looks morphs every node to its new size, since node sizes now animate on springs.
  - The graph lays itself out again. `relayout()` is also public.
  - A class rule or hook can set `look` per node.
- **Card parts:**
  - a title (the node's `label`);
  - a subtitle and a value: a string, or runs of text, `{ text, color }`, `{ mark }` (a small square) and `{ dot }`
    (a small circle);
  - a `tag` pill on the top edge;
  - a colour stripe down the left edge;
  - the icon on the left;
  - port dots where the flow's edges meet the card, drawn only where an edge actually connects, and never in radial
    layouts.
- **Card options:** size, icon size and inset, padding, font sizes, stripe width and inset, port size, and
  `cardDetailZoom`. Below `cardDetailZoom` only titles are drawn, and below `labelFadeZoom` no card text at all.
- **Card text** is one bitmap per card, cached by content and zoom level, capped at 24 million pixels (least
  recently used dropped first). PNG export draws it too.
- **`cardConnectors`:** where edges meet a card:
  - `"dots"` (the default): port dots only;
  - `"arrows"`: arrowheads, at the end `arrowEnd` picks;
  - `"both"`: the edge stops at the dot's rim, so the arrowhead sits beside the dot.
- **`edgeLineStyle: "arrows"`:** a dotted line of small chevrons, pointing the way `flowToward` says.
- **`lineageColor: "edge"`:** lit lineage edges keep their own colour, and are only widened and flowing. `"theme"`
  (the default) uses the theme's ancestor and descendant colours, as before.
- **New style fields:** `width`, `height`, `stripe`, `portIn`, `portOut`, `subtitle`, `value`, `tag`, `tagColor`,
  `valueColor`.
- **New theme colours:** `cardBorder`, `cardText`, `cardMuted`, `portFill`.
- Tether stays at v0.2.0.

## 0.2.0 (2026-09-30)

A public API, and full customization.

- **One entry point:** `import { … } from "prism"` gets Prism's API and all of Tether's (layouts, forces, tuning), so
  an app needs one import.
- **TypeScript declarations** in `types/`, generated from the JSDoc. `verify` type-checks the source and checks that
  `types/` and API.md's tables are up to date.
- **Options and theme as schemas:** `OPTIONS_SCHEMA` and `THEME_SCHEMA`, where each value has a range, default, label
  and hint. `OPTIONS` and `THEME_OPTIONS` can build a settings UI; the demo's panel is built that way.
- **Validation:**
  - a value out of range is clamped;
  - a wrong type falls back to the default;
  - each problem is warned about once, and `strict: true` throws instead.
- **No hardcoded constants.** These are all options now:
  - node, font and label sizes;
  - the root's emphasis and the tint strength;
  - the hover delay, and the animation and stagger limits;
  - fit and focus padding, and the smart-fit thresholds;
  - input timings: double tap, long press, drag thresholds, pan glide;
  - the background cell size.
- **All colours in the theme:** the renderer's label and interaction colours are theme colours too, and `setTheme`
  applies them live.
- **Events:** `view.on(type, listener)` returns an unsubscribe. There are 18 events: taps, hovers, drags,
  `physicsStart`/`physicsSettle`, `render`, `select`, `optionsChange`, `themeChange` and `destroy`. The `handlers`
  object still works.
- **Styling in steps**, each able to set any style field:
  1. options and theme;
  2. built-in classes;
  3. class rules;
  4. the node's own `style`;
  5. the new `nodeStyle` / `edgeStyle` hooks.
  - Every step's values are checked (`NODE_STYLE_SCHEMA`, `EDGE_STYLE_SCHEMA`), and a size is at least 1.
- **Plugins:**
  - `registerNodeShape`: a polygon, or a GLSL distance function compiled into the shader. A shape that fails to
    compile is reported once and drawn as the default.
  - `registerArrowShape`, `registerEdgeRouting` and `registerEasing`.
  - A name that isn't registered draws the default, with one warning.
- **New methods:** `getViewport`/`setViewport`, `toScreen`/`toGraph`, `positionOf`/`positions`, `selectedId`,
  `resetOptions`, and the constructor's `tuning` and `classStyles`.
- **Input checks:**
  - duplicate node or edge ids keep the first, with a warning;
  - `minZoom` above `maxZoom` is swapped;
  - a custom layout that throws no longer makes `render()` throw.
- **The demo is an API playground:** a control for every option, colour and tuning constant; a plugin of each kind;
  an event log.
- API.md documents it all, including using a view from a Svelte component.

## 0.1.0 (2026-09-30)

The first release, split out of GW2 Visualizer.

- **A WebGL2 renderer:**
  - instanced nodes, edges and arrowheads;
  - signed-distance shapes that stay crisp at any zoom;
  - labels on a 2D layer;
  - springs that animate every change, so one change can interrupt another without a jump;
  - 60 fps at 10,000 nodes.
- **`GraphView`:**
  - morphing from one graph to the next: survivors glide, new nodes grow out of their ancestors, and removed ones fold
    into theirs;
  - hover lineage with travelling light pulses, selection, highlights and flashes;
  - fit, focus and PNG export.
- **Dragging runs through Tether:** elastic or floating.
- **Fixes from an audit:**
  - WebGL context loss and restore;
  - multi-touch during a drag;
  - size options apply at once;
  - transitions fold along the graph's own links;
  - any CSS colour, with alpha;
  - label wrapping;
  - a complete `destroy()`;
  - device-pixel-ratio changes;
  - export limits;
  - non-finite positions can't hang the renderer.
- A drag held through a render rests on the new layout.
