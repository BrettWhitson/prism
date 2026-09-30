# Prism

A graphing and rendering engine for the browser. Give it nodes and edges; it styles them and draws them on the GPU
(WebGL2), morphs smoothly from one graph to the next, and handles what the viewer does: hover lineage, selection,
highlights, panning and zooming, fitting the view and PNG export. It holds 60 fps at 10,000 nodes.

Prism doesn't position anything itself. [Tether](https://github.com/BrettWhitson/tether), its one dependency, does
all the physics: the layouts, the forces, and how the graph moves when a node is dragged. Prism hands Tether the
graph and the pointer's moves, and draws the positions Tether returns.

- **Fully customizable:** every option (about 80), theme colour and physics constant is described by a schema
  (type, range, default, label, hint) and checked. Bad values are clamped or defaulted with a warning, or throw in
  strict mode. The schemas can build a settings UI; the demo's panel is built that way.
- **Styling in steps:** options and theme, then class rules, then each node's own `style`, then a `nodeStyle` hook.
  Every step can change any style field.
- **Events:** `view.on("nodeTap", …)` returns its own unsubscribe. There are 18 events, from taps and drags to
  physics settling and option changes.
- **Plugins:** custom node shapes (a polygon, or a GLSL distance function compiled into the shader), arrowheads,
  edge routings and animation feels, plus Tether's custom layouts and forces.
- **Typed:** plain ES modules with no build step, and TypeScript declarations in `types/`.

```js
import { GraphView } from "prism";

const view = new GraphView({
  container: document.getElementById("graph"),
  // Layout and physics options go to Tether.
  options: { direction: "LR", physicsMode: "floating", edgeRouting: "round-taxi" },
  theme: { edge: "#44506a" },
  classStyles: { nodes: { important: { ring: "#ffd166", shape: "hexagon" } } },
});

view.on("nodeTap", ({ id }) => view.select(id));
view.on("nodeHoverStart", ({ id }) => view.showLineage(id));
view.on("nodeHoverEnd", () => view.clearLineage());

view.render({
  nodes: [
    { id: "a", label: "Start", color: "#62a4da" },
    { id: "b", label: "Next", classes: ["important"] },
  ],
  edges: [{ source: "a", target: "b", label: "2" }],
  fit: true,
});
```

Edges run parent → child, from the root outward. The root is the node with `root: true`, or else the first one.

The full reference is in [API.md](API.md), including using a view from a Svelte component.

In a browser without a bundler, map the imports:

```html
<script type="importmap">
  {
    "imports": {
      "prism": "./node_modules/prism/src/index.js",
      "tether/": "./node_modules/tether/src/"
    }
  }
</script>
```

## Layout of the code

| Where | What |
| --- | --- |
| `src/index.js` | the public API (Tether's included): import everything from here |
| `src/graph-view.js` | `GraphView`: calls Tether to lay out and to move nodes, and the renderer to draw; emits the events |
| `src/options.js` | the options schema: every option, its range and its default |
| `src/style.js` | the theme schema, and options + theme + classes + hooks → what each node and edge looks like |
| `src/render/` | the WebGL2 renderer (`WebGLGraph`): instanced nodes, edges and arrowheads, canvas labels, and springs that animate every visual change. It imports nothing from the rest of Prism (a test checks), so it can be used, or split out, on its own. |
| `src/render/plugins.js` | the shape, arrowhead, routing and easing registries |

## Development

Prism needs Tether beside it (a peer dependency): install both, from GitHub.

```sh
npm install github:BrettWhitson/prism#v0.3.2 github:BrettWhitson/tether#v0.3.1
```

When upgrading, install Tether first, then Prism: npm checks Prism's peer range against the Tether already
installed, so upgrading both in one command fails (ERESOLVE) while the old Tether is still there.

```sh
npm install      # fetches Tether from GitHub (a dev dependency here)
npm run demo     # http://localhost:8650/demo/: every option, colour and constant, live
npm run verify   # lint, prettier, type check, declarations and docs up to date, tests
npm run types    # regenerate types/ after changing a JSDoc type
npm run docs     # regenerate API.md's tables after changing a schema
```

To work on Prism and Tether together, point Prism at your Tether checkout: `npm install --no-save ../tether`.
