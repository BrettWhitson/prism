import { GraphView } from "../src/index.js";

const $ = (id) => document.getElementById(id);
const PALETTE = ["#62a4da", "#8fd07a", "#d6a74a", "#c678dd", "#e0645c"];

/** A random tree of `count` nodes (the same one for the same seed); `shared` adds second parents. */
function makeGraph(count, shared, seed) {
  let state = seed;
  const random = () =>
    ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
  const nodes = [{ id: "n0", label: "Root", color: PALETTE[0] }];
  const edges = [];
  const depth = [0];
  for (let i = 1; i < count; i++) {
    const parent = Math.floor(random() ** 1.6 * i);
    depth[i] = depth[parent] + 1;
    nodes.push({
      id: `n${i}`,
      label: `Node ${i}`,
      color: PALETTE[depth[i] % PALETTE.length],
      classes: random() < 0.1 ? ["marked"] : [],
    });
    edges.push({
      source: `n${parent}`,
      target: `n${i}`,
      label: `${1 + Math.floor(random() * 5)}`,
    });
    if (shared && i > 3 && random() < 0.15) {
      const other = 1 + Math.floor(random() * (i - 1));
      if (other !== parent && depth[other] < depth[i])
        edges.push({ source: `n${other}`, target: `n${i}` });
    }
  }
  return { nodes, edges };
}

const view = new GraphView({
  container: $("graph"),
  options: { direction: $("direction").value },
  handlers: {
    onNodeTap: (id) => view.select(id),
    onBackgroundTap: () => view.select(null),
    onNodeHoverStart: (id) => view.showLineage(id),
    onNodeHoverEnd: () => view.clearLineage(),
  },
});
view.setClassStyles({
  nodes: { marked: { ring: "#ffd166", aura: "#ffd166" } },
});

let seed = 7;
function draw({ grow = false } = {}) {
  const shared = $("shared").checked;
  const size = Number($("size").value);
  view.setOptions({
    direction: $("direction").value,
    layered: shared,
    physicsMode: $("physics").value,
    edgeLabels: size <= 60,
  });
  const started = performance.now();
  view.render({ ...makeGraph(size, shared, seed), fit: true, grow });
  const ms = Math.round(performance.now() - started);
  $("status").textContent =
    `${view.nodeIds().length} nodes, laid out in ${ms} ms`;
}

for (const id of ["direction", "shared", "physics"])
  $(id).onchange = () => draw();
$("size").onchange = () => draw({ grow: true });
$("regenerate").onclick = () => {
  seed = (seed * 48271) % 2147483647;
  draw({ grow: true });
};
$("fit").onclick = () => view.fit();
draw({ grow: true });
globalThis.view = view; // for poking at from the console
