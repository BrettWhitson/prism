# Prism

A graphing and rendering engine for the browser. Give it nodes and edges; it styles them and draws them on the GPU
(WebGL2), morphs smoothly from one graph to the next, and handles what the viewer does: hover lineage, selection,
highlights, panning and zooming, fitting the view and PNG export. It holds 60 fps at 10,000 nodes.

Prism doesn't position anything itself. [Tether](https://github.com/BrettWhitson/tether), its one dependency, does
all the physics: the layouts, the forces, and how the graph moves when a node is dragged. Prism hands Tether the
graph and the pointer's moves, and draws the positions Tether returns.

No build step: plain ES modules.

```js
import { GraphView } from "prism";

const view = new GraphView({
  container: document.getElementById("graph"),
  // Layout and physics options are passed through to Tether.
  options: { direction: "LR", physicsMode: "floating" },
  handlers: {
    onNodeTap: (id) => view.select(id),
    onNodeHoverStart: (id) => view.showLineage(id),
    onNodeHoverEnd: () => view.clearLineage(),
  },
});

view.render({
  nodes: [
    { id: "a", label: "Start", color: "#62a4da" },
    { id: "b", label: "Next", classes: ["important"] },
  ],
  edges: [{ source: "a", target: "b", label: "2" }],
  fit: true,
});

// Your own classes, in Prism's visual language: aura, ring, badge, pattern, border…
view.setClassStyles({ nodes: { important: { ring: "#ffd166" } } });
```

Edges run parent → child, from the root outward. The root is the node with `root: true`, or else the first one.

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
| `src/graph-view.js` | `GraphView`: the engine's API. Calls Tether to lay out and to move nodes, and the renderer to draw. |
| `src/options.js` | every option and its default |
| `src/style.js` | options + theme + classes → what each node and edge looks like; `DEFAULT_THEME` |
| `src/render/` | the WebGL2 renderer (`WebGLGraph`): instanced nodes, edges and arrowheads, canvas labels, and springs that animate every visual change. It imports nothing from the rest of Prism (a test checks), so it can be used, or split out, on its own. |

## Development

```sh
npm install      # fetches Tether from GitHub
npm run demo     # http://localhost:8650/demo/
npm run verify   # lint, prettier, tests
```
