# Prism API

Everything below is exported from the entry point, `import { … } from "prism"`. That includes all of
[Tether's API](https://github.com/BrettWhitson/tether/blob/main/API.md) (layouts, forces, tuning), so an app needs only
this one import. The modules behind it (`prism/<module>.js`) stay importable, but only the entry point is the stable
interface. Types for all of it are in `types/` (`Options`, `Theme`, `NodeStyle`, `GraphViewEvents`, …).

- [A view](#a-view)
- [Rendering](#rendering)
- [Options](#options)
- [Theme](#theme)
- [Styling](#styling)
- [Cards](#cards)
- [Events](#events)
- [Selection, lineage and highlights](#selection-lineage-and-highlights)
- [Viewport](#viewport)
- [Physics](#physics)
- [Export](#export)
- [Plugins](#plugins)
- [Using it from a component](#using-it-from-a-component)
- [The renderer on its own](#the-renderer-on-its-own)

## A view

```js
import { GraphView } from "prism";

const view = new GraphView({
  container: document.getElementById("graph"), // the graph fills it
  options: { direction: "LR", edgeRouting: "round-taxi" },
  theme: { edge: "#44506a" },
});
view.on("nodeTap", ({ id }) => view.select(id));
view.render({ nodes, edges, fit: true });
```

`new GraphView(config)`:

| Field | What it is |
| --- | --- |
| `container` | the element the canvases fill (required) |
| `options` | any subset of [the options](#options) |
| `theme` | any subset of [the theme](#theme) |
| `tuning` | any subset of Tether's tuning constants (see `setPhysicsTuning`) |
| `classStyles` | [class rules](#styling) |
| `handlers` | a shortcut for `on()`: `onNodeTap(id, event)`, `onNodeDoubleTap`, `onNodeContextTap`, `onBackgroundTap()`, `onNodeHoverStart(id, event)`, `onNodeHoverEnd()`, `onPointerMove(event)`, `onViewportChange()` |
| `canvasWrapper` | an element whose CSS background follows pan and zoom (`canvasBackground`) |
| `strict` | invalid options and colours throw instead of warning |
| `rendererOptions` | `{ preserveDrawingBuffer?, badgeUrl? }`: `badgeUrl` is the image drawn on nodes whose style has `badge: true` |

It throws when the browser has no WebGL2, leaving the container as it was. `destroy()` stops everything, removes the
canvases and every listener.

## Rendering

### `render({ nodes, edges, fit?, anchorNodeId?, grow? })`

Replaces the graph, morphing from the previous one: survivors glide to their new places, new nodes grow out of their
nearest surviving ancestor, removed ones fold into theirs. Tether lays it out first, synchronously.

- Node: `{ id, label?, color?, icon?, classes?, root?, style?, …your own fields }`. `color` sets its border (and
  tint), `icon` is an image URL, `classes` an array or space-separated string, `style` its own
  [style overrides](#styling). The root is the node with `root: true`, or the first one.
- Edge: `{ id?, source, target, label?, sourceColor?, targetColor?, classes?, style?, … }`, parent → child.
- `fit`: fit the view to the graph; `"smart"` opens on the root instead when fitting would be too small to read.
- `anchorNodeId`: keep this node where it is on screen.
- `grow`: a brand-new graph that grows out of its root level by level.

Ids must be unique: of nodes (or edges) sharing an id, the first is kept and the rest dropped, with a warning. An
edge's id is its `id`, or `"source->target"`, so give parallel edges their own ids. A custom layout that throws falls
back to the tree with a warning, so `render()` doesn't throw for it.

`updateInPlace(nodeUpdates, edgeUpdates?)` changes labels, colours, classes and styles without a new layout (each
update has its `id`). `clear()` removes everything. `nodeIds()`, `hasNode(id)` and `rootNodeId` describe what's
drawn.

## Options

Pass any subset to the constructor, `setOptions(patch)` or `resetOptions(keys?)`; `view.options` returns a copy.
Everything applies at once, except layout and physics options (and the room left for sizes and labels), which apply
from the next `render()`.

Values are checked against `OPTIONS_SCHEMA`: numbers out of range are clamped, wrong types and unknown choices fall
back to the default, unknown keys are ignored ("did you mean" for typos), each with one `console.warn`, or a
`TypeError` with `strict: true`. Choices marked "or registered" also accept anything added with a
[plugin](#plugins). `minZoom` and `maxZoom` given out of order are swapped, with a warning.
`OPTIONS` lists every option (`{ key, type, default, min, max, step, values, label, group, hint }`)
for building a settings UI, and `resolveOptions(patch)` checks options without a view.

The layout and physics options are Tether's settings: `layout`, `direction`, `layered`, `physicsMode`,
`centerForce`, `repelForce`, `linkForce`, `linkDistance` and `forces`
([documented there](https://github.com/BrettWhitson/tether/blob/main/API.md#settings)). Prism's own:

<!-- generated:options -->

**Nodes**

| Option | Default | Values | What it does |
| --- | --- | --- | --- |
| `nodeSize` | `48` | 4 – 400 | Base width and height of a node, in graph units (before nodeSizeScale). |
| `nodeSizeScale` | `1` | 0.2 – 4 | Multiplies every node's size. |
| `rootSizeScale` | `1.35` | 0.5 – 4 | The root is this much bigger than other nodes. |
| `nodeShape` | `"round-rectangle"` | `round-rectangle`, `rectangle`, `ellipse`, `hexagon`, `octagon`, `diamond`, `round-diamond`, or registered | A built-in shape, or one added with registerNodeShape(). |
| `tintNodeFill` | `false` | true / false | Fill nodes with a tint of their colour instead of the theme's node fill. |
| `tintFillAlpha` | `0.3` | 0 – 1 | How opaque the tinted fill is. |
| `nodeBorderWidth` | `3` | 0 – 20 | Node border width, in graph units. |
| `rootBorderBoost` | `1.5` | 0 – 10 | The root's border is this much thicker. |
| `showIcons` | `true` | true / false | Draw each node's icon (its `icon` URL). |

**Cards**

| Option | Default | Values | What it does |
| --- | --- | --- | --- |
| `nodeLook` | `"icon"` | `icon`, `card` | "icon": square nodes with their label beside them. "card": wide cards with the text inside (title, subtitle, value, tag), a colour stripe and port dots. Switching morphs the graph and lays it out again. |
| `cardWidth` | `222` | 60 – 1000 | Card width, in graph units. |
| `cardHeight` | `64` | 24 – 400 | Card height, in graph units. |
| `cardIconSize` | `28` | 0 – 200 | The icon's size on a card (0: no icon). |
| `cardIconInset` | `11` | 0 – 100 | How far the icon sits from the card's left edge. |
| `cardPadding` | `10` | 0 – 60 | Space at the card's right edge. |
| `cardTitleSize` | `12.5` | 4 – 48 | The title's font size. |
| `cardSubtitleSize` | `11` | 4 – 48 | The subtitle's font size. |
| `cardValueSize` | `12` | 4 – 48 | The value's font size. |
| `cardStripeWidth` | `3` | 0 – 20 | The colour stripe down the card's left edge (0: none). |
| `cardStripeInset` | `7` | 0 – 100 | How far the stripe stops short of the card's top and bottom. |
| `cardConnectors` | `"dots"` | `dots`, `arrows`, `both` | Where edges meet a card: port "dots", "arrows" (arrowheads, at the end arrowEnd picks), or "both" (the arrowhead stops at the dot). |
| `cardPortSize` | `8` | 0 – 40 | The port dots where the flow's edges meet a card (0: none). |
| `cardDetailZoom` | `0.55` | 0 – 4 | Below this zoom cards show only their title; below labelFadeZoom, no text at all. |

**Labels**

| Option | Default | Values | What it does |
| --- | --- | --- | --- |
| `showLabels` | `true` | true / false | Draw node labels. |
| `fontSize` | `11` | 4 – 48 | Base label font size, in graph units (before labelFontScale). |
| `labelFontScale` | `1` | 0.3 – 4 | Multiplies every label's font size. |
| `rootFontScale` | `1.2` | 0.5 – 3 | The root's label is this much bigger (and bold). |
| `labelPosition` | `"auto"` | `auto`, `below`, `above`, `left`, `right` | "auto": beside nodes in horizontal trees, below everywhere else. |
| `labelBackdrop` | `true` | true / false | A dark backdrop behind labels, for contrast over edges. |
| `labelFadeZoom` | `0.35` | 0 – 4 | Labels fade out below this zoom (except focused and high-priority ones). |
| `labelWidth` | `120` | 20 – 1000 | Labels wrap (or cut off) at this width, in graph units (before labelWrapScale). |
| `labelWrapScale` | `1` | 0.2 – 5 | Multiplies the wrap width. |
| `labelOverflow` | `"wrap"` | `wrap`, `ellipsis` | Long labels wrap onto more lines, or are cut off with an ellipsis. |

**Edges**

| Option | Default | Values | What it does |
| --- | --- | --- | --- |
| `edgeRouting` | `"taxi"` | `straight`, `taxi`, `round-taxi`, `curved`, or registered | How edges bend; radial layouts use arcs for anything but "straight". Or one added with registerEdgeRouting(). |
| `edgeCornerRadius` | `10` | 0 – 100 | round-taxi: how round the corners are. |
| `edgeCurvature` | `1` | -4 – 4 | Arcs (radial layouts): how far edges bow. |
| `edgeWidth` | `1.6` | 0.1 – 20 | Edge width, in screen pixels. |
| `edgeOpacity` | `1` | 0 – 1 | How opaque edges are. |
| `edgeLineStyle` | `"solid"` | `solid`, `dashed`, `dotted`, `arrows` | Every edge's line pattern (classes can override it). "arrows": a dotted line of small chevrons pointing the way the graph flows (flowToward). |
| `edgeColorMode` | `"neutral"` | `neutral`, `source`, `target` | "neutral": the theme's edge colour; "source" or "target": the colour of the node at that end. |
| `showArrows` | `true` | true / false | Draw arrowheads. |
| `arrowShape` | `"triangle"` | `triangle`, `vee`, `chevron`, `triangle-backcurve`, `circle`, `square`, `tee`, or registered | A built-in arrowhead, or one added with registerArrowShape(). |
| `arrowEnd` | `"target"` | `target`, `source`, `both` | Which end of an edge gets the arrowhead. |
| `arrowScale` | `0.8` | 0.1 – 5 | Arrowhead size. |
| `edgeLabels` | `true` | true / false | Draw edge labels (an edge's `label`). |

**Interaction**

| Option | Default | Values | What it does |
| --- | --- | --- | --- |
| `hoverMode` | `"both"` | `both`, `ancestors`, `descendants`, `none` | What hovering a node lights up. |
| `hoverDelay` | `35` | 0 – 2000 | Milliseconds before hover lineage shows, so sweeping across the graph doesn't flicker. |
| `lineageColor` | `"theme"` | `theme`, `edge` | "theme": lit lineage edges take the theme's ancestors and descendants colours. "edge": they keep their own colour (class rules, edgeColorMode) and are only widened and flowing. |
| `pinSelectionLineage` | `true` | true / false | Keep the selected node's lineage lit after the pointer leaves it. |
| `animateFlow` | `true` | true / false | Light pulses travel along lit edges. |
| `flowToward` | `"target"` | `target`, `source` | Which way the pulses travel. |
| `flowSpeed` | `1` | 0 – 10 | How fast the pulses travel. |
| `dimOpacity` | `0.18` | 0 – 1 | How visible everything outside a lit lineage or highlight stays. |
| `nodesDraggable` | `true` | true / false | Nodes can be dragged (the physics mode decides what follows). |
| `smoothZoom` | `true` | true / false | Wheel zoom glides instead of stepping. |
| `zoomSpeed` | `1` | 0.1 – 5 | Wheel zoom sensitivity. |
| `minZoom` | `0.005` | 0.0001 – 1 | How far out you can zoom. |
| `maxZoom` | `4` | 0.1 – 100 | How far in you can zoom. |
| `maxFitZoom` | `1.6` | 0.05 – 100 | Fitting the view never zooms in past this. |
| `fitPadding` | `40` | 0 – 500 | Space around the graph when fitting the view (screen pixels). |
| `focusPadding` | `60` | 0 – 500 | focusOn(): space around the nodes (screen pixels). |
| `focusMaxZoom` | `2` | 0.05 – 100 | focusOn() never zooms in past this. |
| `smartFitMinZoom` | `0.3` | 0 – 4 | fit: "smart" opens on the root instead when fitting would zoom out below this… |
| `smartFitMinNodes` | `80` | 0 – 100000 | …and the graph has more nodes than this… |
| `smartFitZoom` | `0.6` | 0.05 – 4 | …at this zoom. |
| `doubleTapMs` | `300` | 50 – 2000 | Most milliseconds between the taps of a double tap. |
| `longPressMs` | `550` | 100 – 5000 | Milliseconds a touch is held before it counts as a context tap. |
| `dragThresholdMouse` | `4` | 0 – 50 | Pixels a mouse moves before a press becomes a drag. |
| `dragThresholdPen` | `6` | 0 – 50 | Pixels a pen moves before a press becomes a drag. |
| `dragThresholdTouch` | `10` | 0 – 50 | Pixels a finger moves before a press becomes a drag. |
| `panInertia` | `0.28` | 0 – 3 | How long the view glides after a flick (seconds; 0: it stops dead). |
| `flickMinSpeed` | `120` | 0 – 5000 | Pixels per second a pan must be moving at release to glide. |
| `canvasBackground` | `"none"` | string | "dots" or "grid": a pattern on the canvas wrapper that follows pan and zoom (see syncBackground). Anything else is left alone. |
| `backgroundCellSize` | `26` | 4 – 200 | The background pattern's cell at zoom 1 (graph units). |

**Motion**

| Option | Default | Values | What it does |
| --- | --- | --- | --- |
| `animationsEnabled` | `true` | true / false | Animate changes (off: everything snaps). |
| `animationDuration` | `450` | 0 – 5000 | About how long a transition takes (milliseconds). |
| `animationEasing` | `"smooth"` | `smooth`, `snappy`, `bouncy`, `linear`, or registered | How motion feels, or one added with registerEasing(). |
| `growNewGraphs` | `true` | true / false | A brand-new graph grows out of its root level by level. |
| `growStagger` | `0.18` | 0 – 2 | Delay per level while growing, as a share of the duration. |
| `growMaxDelay` | `1.4` | 0 – 10 | The longest any level waits, as a share of the duration. |
| `maxAnimatedNodes` | `5000` | 0 – 1000000 | Graphs bigger than this snap instead of morphing. |
| `maxStaggeredNodes` | `800` | 0 – 1000000 | Graphs bigger than this appear at once instead of growing level by level. |

**Styling**

| Option | Default | Values | What it does |
| --- | --- | --- | --- |
| `nodeStyle` | `null` | function | (node, style) => changes: return any style fields to change for this node (after classes and node.style). |
| `edgeStyle` | `null` | function | (edge, style) => changes: return any style fields to change for this edge (after classes and edge.style). |

<!-- /generated:options -->

## Theme

Every colour Prism draws with. Pass any subset to the constructor or `setTheme(patch)`; `view.theme` returns a copy.
Colours are checked: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()` or `transparent`.
`THEME_OPTIONS` lists them for a settings UI.

<!-- generated:theme -->

| Colour | Default | What it colours |
| --- | --- | --- |
| `node` | `#8a93a6` | A node's colour (border, tint) when its data has none. |
| `nodeFill` | `#1a2030` | Inside nodes (unless tintNodeFill). |
| `edge` | `#3b4558` | Edges (edgeColorMode: neutral). |
| `ancestors` | `#d6a74a` | Lit edges toward the root, on hover or selection. |
| `descendants` | `#62a4da` | Lit edges away from the root. |
| `highlight` | `#ffd166` | setHighlightedNodes() glow. |
| `focus` | `#62a4da` | flash() glow. |
| `selected` | `#f0c46a` | The selected node's glow. |
| `hover` | `#cfd8ea` | The hovered node's glow. |
| `labelText` | `#e3e6ec` | Node labels. |
| `edgeLabelText` | `#8a93a6` | Edge labels. |
| `labelBackdrop` | `rgba(11, 14, 20, 0.8)` | Behind node labels (labelBackdrop). |
| `edgeLabelBackdrop` | `rgba(13, 16, 23, 0.9)` | Behind edge labels. |
| `cardBorder` | `#2a3242` | Card outlines (the node's colour goes to its stripe). |
| `cardText` | `#e3e6ec` | A card's title and value. |
| `cardMuted` | `#8a93a6` | A card's subtitle. |
| `portFill` | `#0d1017` | Inside the port dots, and behind a card's tag. |

<!-- /generated:theme -->

## Styling

Each node's look is resolved in steps, and every step can change any field of its `NodeStyle`:

1. the options and theme;
2. the built-in classes: `root` (bigger, bold, its label wins) and `collapsed` (a card stack: there's more inside);
3. class rules, in the order given to `setClassStyles` (or the constructor's `classStyles`);
4. the node's own `style`;
5. the `nodeStyle` hook: `(node, style) => changes`, with your own fields on `node`.

Edges work the same way with `EdgeStyle`, class rules under `edges`, the edge's `style` and the `edgeStyle` hook.

```js
view.setClassStyles({
  nodes: { owned: { ring: "#7ac46b" }, rare: { shape: "star", aura: "#ffd166" } },
  edges: { optional: { pattern: "dashed", color: "#6b7385" } },
});
view.setOptions({
  nodeStyle: (node, style) => (node.weight > 0.8 ? { size: style.size * 1.5 } : null),
});
```

| NodeStyle | What it is |
| --- | --- |
| `size` | width and height (graph units) |
| `shape` | a built-in or registered shape |
| `fill`, `fillAlpha` | the inside |
| `border`, `borderWidth` | the outline |
| `pattern` | `"solid"`, `"dashed"`, `"dotted"` or `"stack"` (a card peeking out behind) |
| `iconAlpha` | the icon's opacity |
| `aura` | a soft glow around the node for a standing state, or null |
| `ring` | a thin ring just outside the border, or null |
| `badge` | the badge image in the corner |
| `label`, `fontSize`, `bold`, `labelPriority` | the label; higher priorities stay when zoomed out and win collisions |
| `events` | false: the pointer passes through (no hover, tap or drag) |

| EdgeStyle | What it is |
| --- | --- |
| `color`, `width`, `alpha` | the line |
| `pattern` | `"dashed"`, `"dotted"`, `"arrows"` (small chevrons pointing toward `patternToward`, which follows `flowToward`) or null |
| `arrowAtSource`, `arrowAtTarget` | an arrowhead shape, or null |
| `arrowScale` | arrowhead size |
| `label`, `fontSize` | the label |
| `glow` | a soft glow under the line |

Every step's values are checked (`NODE_STYLE_SCHEMA`, `EDGE_STYLE_SCHEMA`): numbers out of range are clamped, and
unknown fields and unusable values (a malformed colour, an unknown pattern) are left out, each with one warning per
source. `null` clears `aura`, `ring`, an edge's `pattern` and its arrowheads, and is ignored elsewhere.

`resolveNodeStyle` and `resolveEdgeStyle` run the pipeline on their own, for tests and tools.

## Cards

`nodeLook: "card"` draws nodes as wide cards with their text inside, instead of square icons with a label beside
them (`"icon"`, the default). Switching looks morphs every node to its new size and lays the graph out again. A class
rule or the `nodeStyle` hook can set `look` per node.

A card has a title (the node's `label`), a subtitle, a value and a tag, all from the node's own fields, plus a
colour stripe down its left edge, its icon on the left, and port dots where the flow's edges meet it:

```js
view.setOptions({ nodeLook: "card", direction: "LR" });
view.render({
  nodes: [
    {
      id: "bolt",
      label: "Bolt",
      icon: "…",
      color: "#a335ee", // the stripe and the ports, unless the style says otherwise
      subtitle: ["×1 ", { mark: "#c678dd" }, " Mystic Forge"],
      value: ["2,199", { dot: "#e2b54f" }, " 34", { dot: "#b9bec7" }],
      tag: "✓ 2 owned",
    },
  ],
  edges: [],
});
```

Where edges meet a card, `cardConnectors` picks the connector: port `"dots"` (the default), `"arrows"` (arrowheads,
on the end `arrowEnd` picks) or `"both"` (the arrowhead stops at the dot's rim, beside it).

`subtitle` and `value` are a string or a list of runs: strings, `{ text, color }`, `{ mark: color }` (a small square)
and `{ dot: color }` (a small circle). Card style fields: `width`, `height`, `stripe`, `portIn` (the leaf side of the
flow), `portOut` (the root side), `tagColor`, `valueColor`, and the sizes from the card options. A port is drawn only
where an edge meets the card (in: it has children; out: it has a parent), and never in radial layouts. Below
`cardDetailZoom` only titles are drawn, and below `labelFadeZoom` no card text at all, so thousands of cards stay
fast. The text bitmaps are cached, capped by size.

## Events

`view.on(type, listener)` returns a function that unsubscribes; `once(type, listener)` and `off(type, listener)`
work as you'd expect. Every listener gets one object. A listener that throws is reported with `console.error` and
doesn't stop the others.

| Event | Payload | When |
| --- | --- | --- |
| `nodeTap` | `{ id, originalEvent }` | a node was clicked or tapped |
| `nodeDoubleTap` | `{ id, originalEvent }` | double click or tap |
| `nodeContextTap` | `{ id, originalEvent }` | right click or long press |
| `backgroundTap` | `{ originalEvent? }` | the empty canvas was clicked |
| `nodeHoverStart` | `{ id, originalEvent }` | the pointer entered a node |
| `nodeHoverEnd` | `{}` | …and left it |
| `pointerMove` | `{ originalEvent }` | the pointer moved over the canvas |
| `viewportChange` | `{ viewport }` | pan or zoom (every frame while it moves) |
| `dragStart` | `{ id }` | a node was grabbed |
| `drag` | `{ id, x, y }` | the held node moved (graph coordinates) |
| `dragEnd` | `{ id }` | it was let go |
| `physicsStart` | `{ reason }` | the physics started moving nodes: `"drag"`, `"shake"` or `"float-in"` |
| `physicsSettle` | `{}` | …and went still |
| `render` | `{ nodeCount, edgeCount, layoutMs }` | after `render()` |
| `select` | `{ id }` | the selection changed (`id` null: nothing selected) |
| `optionsChange` | `{ changed }` | `setOptions` changed these keys |
| `themeChange` | `{ changed }` | `setTheme` changed these colours |
| `destroy` | `{}` | the view is going away |

Clicking doesn't select anything by itself: the app decides, for example
`view.on("nodeTap", ({ id }) => view.select(id))`.

## Selection, lineage and highlights

| Method | What it does |
| --- | --- |
| `select(id)` | select a node (null: none); with `pinSelectionLineage`, its lineage stays lit |
| `selectedId` | the selected node, or null |
| `showLineage(id)` | light a node's ancestors and/or descendants (`hoverMode`), after `hoverDelay`; the rest dims |
| `clearLineage()` | back to the selection's lineage |
| `setHighlightedNodes(ids)` | these glow (`theme.highlight`) and the rest dims; null clears it |
| `flash(ids, ms?)` | these glow (`theme.focus`) for a moment |
| `pulse(id)` | a node flares briefly |

## Viewport

| Method | What it does |
| --- | --- |
| `fit()` | fit the graph (`maxFitZoom`, `fitPadding`) |
| `focusOn(ids, { padding?, includeNeighbours?, maxZoom? })` | fit some nodes |
| `revealNode(id)` | pan just enough to show a node |
| `centerOnRoot()` | centre the root |
| `zoomBy(factor)` | zoom around the centre |
| `getViewport()` / `setViewport({ zoom?, panX?, panY? }, { animate? })` | save and restore the camera |
| `toScreen(x, y)` / `toGraph(x, y)` | graph coordinates ↔ CSS pixels in the container |
| `positionOf(id)` / `positions()` | where nodes are drawn now |
| `boundingBox()` | the box around everything drawn |
| `resize()` | the container changed size (a ResizeObserver already calls it) |
| `syncBackground()` | update the `canvasWrapper`'s pattern (automatic on pan and zoom) |

## Physics

Tether lays the graph out and moves it afterwards, in the `physicsMode`: `"elastic"`, `"floating"` or `"none"`.

| Member | What it does |
| --- | --- |
| `setPhysicsTuning(tuning)` / `physicsTuning` | Tether's constants for this view (checked; the rest back to defaults) |
| `settle({ heat?, scatter? })` | shake the graph and let it settle |
| `stopPhysics()` / `physicsRunning` | stop, or ask whether it's moving |
| `beginDrag(id)` | drag from code, like a pointer: `{ move(x, y), end() }` in graph coordinates |
| `simulation`, `elasticNet` | the running simulation and elastic net, for developer tools |

Custom layouts and forces are registered with Tether's `registerLayout` and `registerForce` (both re-exported
here), then chosen with the `layout` and `forces` options.

## Export

`toPngDataUri({ scale?, backgroundColor? })` draws the whole graph, every label included, as a PNG data URI.

## Plugins

Each registry is global and live: registering while views are drawing takes effect on their next frame. A shape,
arrowhead, routing or easing name nothing is registered under (yet) draws the default, with one warning per name.

### `registerNodeShape(name, definition)`

Adds a node shape for `nodeShape` or a style's `shape`. Two ways to describe it:

```js
// A polygon in a unit box (-1..1, y down), 3 to 64 points, stretched to the node's box. No GLSL needed.
registerNodeShape("star", { polygon: starPoints, rounding: 0.15 });

// The body of `float shape(vec2 p, vec2 h)`: the signed distance (negative inside) from p to a shape filling the
// half-size box h, both relative to the node's centre.
registerNodeShape("pill", {
  glsl: "float r = min(h.x, h.y); vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;",
});
```

A GLSL shape that doesn't compile is drawn as the default shape, with one warning naming it; the others keep working.
It's left out of every later shader and of `nodeShapeNames()` until it's registered again.
Built-in names can't be replaced. `nodeShapeNames()` lists them all.

### `registerArrowShape(name, { triangles, inset? })`

Adds (or replaces) an arrowhead for `arrowShape`: triangle corners `[back, side]` in arrow sizes, three per triangle,
with the tip at `[0, 0]` and `back` running back along the edge. `inset` is how far the line stops short of the tip.

### `registerEdgeRouting(name, route)`

Adds (or replaces) a routing for `edgeRouting`. `route(source, target, { flowAxis, cornerRadius, curvature })` gets
each end as `{ x, y, hw, hh }` (centre and half-size) and returns a polyline, at least two points, from border to
border. Anything else falls back to a straight line. `edgeRoutingNames()` lists them.

### `registerEasing(name, { speed, damping })`

Adds (or replaces) an animation feel for `animationEasing`. Every motion is a spring that settles in about
`animationDuration`: `speed` sets how quickly it gets going (smooth is 6.6), `damping` whether it overshoots (1
doesn't, 0.5 bounces once, 1.6 glides). `easingNames()` lists them.

## Using it from a component

A view is an ordinary object with a `destroy()`, and `on()` returns its own unsubscribe, which suits component
lifecycles. In Svelte, for example:

```svelte
<script>
  import { onMount } from "svelte";
  import { GraphView } from "prism";

  let { nodes, edges, options = {}, onselect } = $props();
  let container, view;

  onMount(() => {
    view = new GraphView({ container, options });
    view.on("nodeTap", ({ id }) => view.select(id));
    view.on("select", ({ id }) => onselect?.(id));
    return () => view.destroy(); // also removes the listeners
  });

  $effect(() => view?.render({ nodes, edges, fit: true }));
  $effect(() => view?.setOptions(options)); // unchanged options cost nothing
</script>

<div bind:this={container} style="height: 100%"></div>
```

## The renderer on its own

`WebGLGraph` is the GPU renderer underneath, with no layout, styling or physics: nodes arrive with positions and
styles. It imports nothing outside `src/render/`, so it can be used on its own:

```js
import { WebGLGraph } from "prism";

const graph = new WebGLGraph(container, { onNodeTap: (id) => … });
graph.setGraph({ nodes: [{ id, x, y, width, height, style }], edges: [{ id, source, target, style }] });
graph.fitView();
```

`DEFAULT_COLORS` and `DEFAULT_INPUT` are its defaults; `setOptions({ motion, labels, input, dimAlpha, flowSpeed })`
and `setColors(patch)` change them.
