import { test } from "node:test";
import assert from "node:assert/strict";
import { Spring, springFor, stepSpring } from "../src/render/spring.js";
import {
  resolveEdgeStyle,
  resolveLabelPosition,
  resolveNodeStyle,
  resolveRouting,
} from "../src/style.js";
import { DEFAULT_OPTIONS } from "../src/options.js";
import { DEFAULT_THEME } from "../src/style.js";
import {
  arrowTemplate,
  edgeRoute,
  pointAlong,
  polylineLength,
  roundCorners,
} from "../src/render/edge-geometry.js";
import { planTransition } from "../src/render/transition-plan.js";
import { InstanceData, NODE_FLOATS } from "../src/render/instance-data.js";
import {
  flickVelocity,
  parseColor,
  wrapLabel,
} from "../src/render/webgl-graph.js";
import { parseColorAlpha } from "../src/render/color.js";
import { MAX_LABEL_BITMAP, labelBitmapScale } from "../src/render/labels.js";

test("springs settle on their target in about the requested time, and keep velocity when retargeted", () => {
  const params = springFor(500, "smooth");
  const spring = new Spring(0, params, 0.05); // positions: 0.05 world units
  spring.set(100);
  let time = 0;
  while (spring.step(1 / 60)) time += 1 / 60;
  assert.equal(spring.value, 100);
  assert.ok(time > 0.3 && time < 0.9, `settled after ${time}s`);

  // Smooth never overshoots; bouncy does.
  const peak = (feel) => {
    const state = { value: 0, velocity: 0 };
    let max = 0;
    for (let i = 0; i < 120; i++) {
      stepSpring(state, 1, 1 / 60, springFor(500, feel));
      max = Math.max(max, state.value);
    }
    return max;
  };
  assert.ok(peak("smooth") <= 1 + 1e-9);
  assert.ok(peak("bouncy") > 1.05);

  // Retargeting mid-flight bends the motion instead of restarting it.
  const moving = new Spring(0, params);
  moving.set(100);
  for (let i = 0; i < 10; i++) moving.step(1 / 60);
  const velocity = moving.velocity;
  moving.set(-100);
  assert.equal(moving.velocity, velocity);
  moving.snap(5);
  assert.equal(moving.moving, false);
});

test("springs ignore targets and jumps that aren't finite numbers", () => {
  const spring = new Spring(NaN, springFor(300));
  assert.equal(spring.value, 0, "a start that isn't a number is 0");
  spring.set(10);
  for (const bad of [NaN, Infinity, -Infinity, undefined]) {
    spring.set(bad);
    spring.snap(bad);
  }
  assert.equal(spring.target, 10);
  assert.equal(spring.value, 0);
  while (spring.step(1 / 60));
  assert.equal(spring.value, 10);
});

test("springs stay stable with long frames (a background tab)", () => {
  const state = { value: 0, velocity: 0 };
  stepSpring(state, 10, 0.5, springFor(100, "snappy"));
  assert.ok(Number.isFinite(state.value) && Math.abs(state.value - 10) < 1);
});

const options = (overrides = {}) => ({ ...DEFAULT_OPTIONS, ...overrides });
const node = (classes, data = {}, o = options(), rules) =>
  resolveNodeStyle(new Set(classes), data, o, DEFAULT_THEME, rules);
const edge = (classes, data, o = options(), rules) =>
  resolveEdgeStyle(new Set(classes), data, o, DEFAULT_THEME, rules);

test("node style: built-in root and collapsed; the caller's class rules apply last", () => {
  const base = node([], { color: "#ff0000", label: "A" });
  assert.equal(base.border, "#ff0000");
  assert.equal(base.pattern, "solid");
  assert.deepEqual([base.aura, base.ring, base.badge], [null, null, false]);
  assert.equal(base.label, "A");
  assert.equal(node([]).border, DEFAULT_THEME.node);

  assert.equal(node(["collapsed"]).pattern, "stack");
  const root = node(["root"]);
  assert.ok(root.bold && root.labelPriority > 0);
  assert.ok(root.size > base.size);
  assert.equal(
    node([], { label: "A" }, options({ showLabels: false })).label,
    "",
  );
  assert.equal(
    node([], { color: "#ff0000" }, options({ tintNodeFill: true })).fill,
    "#ff0000",
  );

  const rules = {
    nodes: {
      marked: { ring: "#00ff00", badge: true },
      special: { pattern: "dashed", fillAlpha: 0.4, aura: "#123456" },
    },
  };
  const marked = node(["marked", "special"], {}, options(), rules);
  assert.deepEqual(
    [marked.ring, marked.badge, marked.pattern, marked.fillAlpha, marked.aura],
    ["#00ff00", true, "dashed", 0.4, "#123456"],
  );
  // Classes without a rule change nothing.
  assert.deepEqual(node(["unknown"]), node([]));
});

test("edge style: colour mode, arrows per end, labels, class rules", () => {
  const data = { label: "x3", sourceColor: "#111111", targetColor: "#222222" };
  assert.equal(
    edge([], data, options({ edgeColorMode: "target" })).color,
    "#222222",
  );
  assert.equal(
    edge([], data, options({ edgeColorMode: "source" })).color,
    "#111111",
  );
  assert.equal(edge([], data).color, DEFAULT_THEME.edge);

  const atTarget = edge([], data);
  assert.equal(atTarget.arrowAtTarget, DEFAULT_OPTIONS.arrowShape);
  assert.equal(atTarget.arrowAtSource, null);
  const atSource = edge([], data, options({ arrowEnd: "source" }));
  assert.deepEqual(
    [atSource.arrowAtSource, atSource.arrowAtTarget],
    [DEFAULT_OPTIONS.arrowShape, null],
  );
  const both = edge([], data, options({ arrowEnd: "both" }));
  assert.ok(both.arrowAtSource && both.arrowAtTarget);
  assert.equal(
    edge([], data, options({ showArrows: false })).arrowAtTarget,
    null,
  );

  assert.equal(edge([], data).label, "x3");
  assert.equal(edge([], data, options({ edgeLabels: false })).label, "");

  const rules = {
    edges: {
      route: { color: "#e5b83b", width: 3, glow: true },
      alt: { pattern: "dashed" },
    },
  };
  const styled = edge(["route", "alt"], data, options(), rules);
  assert.deepEqual(
    [styled.color, styled.width, styled.glow, styled.pattern],
    ["#e5b83b", 3, true, "dashed"],
  );
});

test("labels sit where the layout leaves room; routing follows the layout", () => {
  const label = (direction) =>
    resolveLabelPosition(options({ labelPosition: "auto", direction }));
  assert.equal(label("RL"), "right");
  assert.equal(label("LR"), "left");
  assert.equal(label("BT"), "below");
  assert.equal(label("radial"), "below");
  assert.equal(
    resolveLabelPosition(options({ labelPosition: "above" })),
    "above",
  );

  const routing = (edgeRouting, direction) =>
    resolveRouting(options({ edgeRouting, direction }));
  assert.equal(routing("taxi", "BT"), "taxi");
  assert.equal(routing("round-taxi", "BT"), "round-taxi");
  assert.equal(routing("curved", "BT"), "s-curve");
  assert.equal(routing("curved", "radial"), "arc");
  assert.equal(routing("taxi", "radial"), "arc");
  assert.equal(routing("straight", "radial"), "straight");
});

test("edge routes: rounded corners, s-curves and arcs start and end on the node borders", () => {
  const a = { x: 0, y: 0, hw: 10, hh: 10 },
    b = { x: 100, y: 60, hw: 10, hh: 10 };
  for (const routing of ["round-taxi", "s-curve"]) {
    const points = edgeRoute(a, b, { routing, flowAxis: "x", cornerRadius: 8 });
    assert.deepEqual(points[0], { x: 10, y: 0 }, routing);
    assert.deepEqual(points.at(-1), { x: 90, y: 60 }, routing);
    assert.ok(points.length > 4, `${routing} is curved`);
  }
  const arc = edgeRoute(a, b, { routing: "arc" });
  const middle = pointAlong(arc, polylineLength(arc) / 2);
  const chord = { x: 50, y: 30 };
  assert.ok(
    Math.hypot(middle.x - chord.x, middle.y - chord.y) > 5,
    "an arc bows off the straight line",
  );

  // Short pieces get smaller corners, never overlapping ones.
  const rounded = roundCorners(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 100 },
    ],
    20,
  );
  assert.ok(rounded.every((p) => p.x >= 0 && p.x <= 4));
  assert.deepEqual(
    pointAlong(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      99,
    ),
    { x: 10, y: 0 },
  );
});

test("arrowheads: every shape is whole triangles with its tip at the origin", () => {
  for (const shape of [
    "triangle",
    "vee",
    "chevron",
    "triangle-backcurve",
    "circle",
    "square",
    "tee",
    "unknown",
  ]) {
    const { triangles, inset } = arrowTemplate(shape);
    assert.equal(triangles.length % 3, 0, shape);
    assert.ok(inset >= 0 && inset <= 1, shape);
    assert.ok(
      triangles.every(([back]) => back >= -0.05),
      `${shape} stays behind the tip`,
    );
  }
});

test("transition plan: new nodes grow out of their nearest shown ancestor; removed ones fold into theirs", () => {
  const previous = new Map([
    ["root", { x: 0, y: 0 }],
    ["a", { x: 10, y: 0 }],
    ["a1", { x: 20, y: 0 }],
    ["a1x", { x: 30, y: 0 }],
    ["gone", { x: 99, y: 99 }],
  ]);
  const parentOf = new Map([
    ["a", "root"],
    ["b", "a"],
    ["b2", "b"],
  ]);
  const plan = planTransition({
    previous,
    nodeIds: ["root", "a", "b", "b2"],
    parentOf,
    previousParentOf: new Map([
      ["a", "root"],
      ["a1", "a"],
      ["a1x", "a1"],
      ["gone", "a"],
    ]),
    rootId: "root",
  });
  assert.deepEqual(
    plan.startOf("a"),
    { x: 10, y: 0 },
    "survivors start where they are",
  );
  assert.deepEqual(
    plan.startOf("b2"),
    { x: 10, y: 0 },
    "grandchildren grow from the nearest shown ancestor",
  );
  const final = new Map([
    ["root", { x: 0, y: 50 }],
    ["a", { x: 10, y: 50 }],
  ]);
  const ghosts = plan.ghostDestinations(final);
  assert.deepEqual(ghosts.get("gone"), { x: 10, y: 50 }, "into its parent");
  assert.deepEqual(
    ghosts.get("a1x"),
    { x: 10, y: 50 },
    "past a parent that's also leaving, into the nearest that stays",
  );
  assert.ok(!ghosts.has("a"), "survivors aren't ghosts");

  const cyclic = planTransition({
    previous: new Map(),
    nodeIds: ["a", "b"],
    parentOf: new Map([
      ["a", "b"],
      ["b", "a"],
    ]),
  });
  assert.equal(cyclic.startOf("a"), null, "cycles end the walk");
});

test("transition plan: ids mean nothing; ghosts with no surviving ancestor go to the anchor or stay put", () => {
  const previous = new Map([
    ["top", { x: 0, y: 0 }],
    ["top/child", { x: 5, y: 5 }],
    ["p", { x: 1, y: 1 }],
    ["q", { x: 2, y: 2 }],
  ]);
  const plan = planTransition({
    previous,
    nodeIds: ["top"],
    parentOf: new Map(),
    // "top/child" has no recorded parent; p and q are each other's parents (a cycle), both leaving.
    previousParentOf: new Map([
      ["p", "q"],
      ["q", "p"],
    ]),
  });
  const final = new Map([["top", { x: 0, y: 40 }]]);
  const ghosts = plan.ghostDestinations(final);
  assert.deepEqual(
    ghosts.get("top/child"),
    { x: 5, y: 5 },
    "a slash in an id isn't a path: it fades where it is",
  );
  assert.deepEqual(ghosts.get("p"), { x: 1, y: 1 }, "a cycle ends the walk");
  assert.deepEqual(ghosts.get("q"), { x: 2, y: 2 });
  const anchored = plan.ghostDestinations(final, "top");
  for (const id of ["top/child", "p", "q"])
    assert.deepEqual(anchored.get(id), { x: 0, y: 40 }, `${id} to the anchor`);
});

test("labels wrap by width, keep their own line breaks, or are cut with an ellipsis", () => {
  const measure = (text) => text.length * 6;
  assert.deepEqual(wrapLabel("One two three", 42, "wrap", measure), [
    "One two",
    "three",
  ]);
  assert.deepEqual(wrapLabel("short\n(3 more)", 100, "wrap", measure), [
    "short",
    "(3 more)",
  ]);
  const [cut] = wrapLabel("A very long node name", 60, "ellipsis", measure);
  assert.ok(cut.endsWith("…") && measure(cut) <= 60);
  assert.deepEqual(wrapLabel("no limit", 0, "wrap", measure), ["no limit"]);
});

test("labels: a word wider than a line is broken; cuts never split a character", () => {
  const measure = (text) => [...text].length * 6; // per code point
  assert.deepEqual(wrapLabel("Supercalifragilistic go", 42, "wrap", measure), [
    "Superca",
    "lifragi",
    "listic",
    "go",
  ]);
  const lines = wrapLabel("x " + "y".repeat(30), 30, "wrap", measure);
  assert.ok(lines.every((line) => measure(line) <= 30));
  assert.equal(lines.join("").replaceAll(" ", ""), "x" + "y".repeat(30));
  assert.deepEqual(
    wrapLabel("W", 1, "wrap", measure),
    ["W"],
    "a character wider than the line still shows",
  );

  const face = "\u{1F600}"; // outside the BMP: a surrogate pair
  const [cut] = wrapLabel(face.repeat(10), 30, "ellipsis", measure);
  assert.equal(cut, face.repeat(4) + "…");
  for (const line of wrapLabel(face.repeat(10), 30, "wrap", measure))
    assert.equal(line, face.repeat(line.length / 2), "whole pairs only");
});

test("label bitmaps are drawn at 2×, less when that would be too big for a canvas", () => {
  assert.equal(labelBitmapScale(100, 20), 2);
  assert.equal(labelBitmapScale(4096, 20), 1);
  assert.ok(labelBitmapScale(20, 1e6) * 1e6 <= MAX_LABEL_BITMAP);
  assert.equal(labelBitmapScale(0, 0), 2);
});

test("colours parse from hex (with or without alpha), rgb() and transparent", () => {
  assert.deepEqual(parseColor("#ff0000"), [1, 0, 0]);
  assert.deepEqual(parseColor("#0f0"), [0, 1, 0]);
  assert.deepEqual(parseColor("#0000FF"), [0, 0, 1]);
  assert.equal(parseColor("nonsense").length, 3);
  assert.deepEqual(parseColorAlpha("#ff000080"), [1, 0, 0, 128 / 255]);
  assert.deepEqual(parseColorAlpha("#0f08"), [0, 1, 0, 136 / 255]);
  assert.deepEqual(parseColorAlpha("#fff"), [1, 1, 1, 1]);
  assert.deepEqual(parseColorAlpha("rgb(255, 0, 0)"), [1, 0, 0, 1]);
  assert.deepEqual(parseColorAlpha("rgba(0, 255, 0, 0.5)"), [0, 1, 0, 0.5]);
  assert.deepEqual(parseColorAlpha("rgb(0 0 255 / 25%)"), [0, 0, 1, 0.25]);
  assert.deepEqual(parseColorAlpha("transparent"), [0, 0, 0, 0]);
  assert.deepEqual(parseColor("#ff000080"), [1, 0, 0], "alpha dropped");
  // No document in Node: names can't be read, and come back grey (opaque).
  const grey = parseColorAlpha("rebeccapurple");
  assert.equal(grey.length, 4);
  assert.equal(grey[3], 1);
  assert.deepEqual(parseColorAlpha(null), grey);
  assert.deepEqual(parseColorAlpha("#12345"), grey, "not a hex length");
});

test("colour fades: nodes and edges blend from the old colours to the new ones", () => {
  const value = (v) => ({ value: v });
  const node = {
    id: "n",
    px: value(0),
    py: value(0),
    alpha: value(1),
    scale: value(1),
    glow: value(0),
    hw: 20,
    hh: 20,
    fill: [1, 0, 0, 1],
    border: [1, 1, 1, 1],
    aura: [0, 0, 0, 0],
    ring: [0, 0, 0, 0],
    glowColor: [1, 1, 1],
    style: {},
    colorFrom: {
      fill: [0, 0, 1, 1],
      border: [1, 1, 1, 1],
      aura: [0, 0, 0, 0],
      ring: [0, 0, 0, 0],
    },
    colorMix: value(0.25),
  };
  const other = { ...node, id: "m", colorFrom: null, colorMix: null };
  const edge = {
    id: "e",
    source: node,
    target: other,
    alpha: value(1),
    emphasis: value(0),
    color: [0, 1, 0],
    colorFrom: { color: [1, 0, 0] },
    colorMix: value(0.5),
    style: { width: 2 },
  };
  const data = new InstanceData();
  data.rebuild({
    ghosts: [],
    nodes: [node, other],
    edges: [edge],
    top: [],
    layout: { routing: "straight" },
    iconUv: () => null,
  });
  const fill = [...data.nodes.data.subarray(4, 8)];
  assert.deepEqual(fill, [0.25, 0, 0.75, 1], "a quarter of the way to red");
  const edgeColor = [...data.edges.data.subarray(4, 7)];
  assert.deepEqual(edgeColor, [0.5, 0.5, 0], "halfway to green");
});

test("a flick glides at the speed of the last moves; holding still before letting go does not", () => {
  const moves = [0, 16, 32, 48, 64].map((at) => ({ at, dx: 20, dy: -5 }));
  const { vx, vy } = flickVelocity(moves, 70);
  assert.ok(
    Math.abs(vx - 1250) < 1 && Math.abs(vy + 312.5) < 1,
    `${vx}, ${vy}`,
  );
  // Same moves, let go 400 ms later: they're stale.
  assert.equal(flickVelocity(moves, 464), null);
  // A slow drag or a single move stops without a glide.
  const slow = [0, 40, 80].map((at) => ({ at, dx: 1, dy: 0 }));
  assert.equal(flickVelocity(slow, 85), null);
  assert.equal(flickVelocity([{ at: 0, dx: 50, dy: 0 }], 5), null);
});

test("instance data: moving a few records rewrites them in place, matching a full rebuild", () => {
  const value = (v) => ({ value: v });
  const node = (id, x, y) => ({
    id,
    px: value(x),
    py: value(y),
    alpha: value(1),
    scale: value(1),
    glow: value(0),
    hw: 20,
    hh: 20,
    fill: [0.1, 0.1, 0.2, 1],
    border: [1, 0.5, 0, 1],
    aura: [0, 0, 0, 0],
    ring: [0, 0, 0, 0],
    glowColor: [1, 1, 1],
    style: { shape: "round-rectangle", icon: "a.png" },
  });
  const edge = (id, source, target) => ({
    id,
    source,
    target,
    alpha: value(1),
    emphasis: value(0),
    emphasisState: null,
    color: [0.3, 0.3, 0.4],
    style: { width: 1.6, arrowAtTarget: "triangle" },
  });
  const [root, a, b, c] = [
    node("root", 0, 0),
    node("a", 200, -80),
    node("b", 200, 80),
    node("c", 400, 80),
  ];
  const edges = [edge("e1", root, a), edge("e2", root, b), edge("e3", b, c)];
  const layout = { routing: "round-taxi", flowAxis: "x", cornerRadius: 10 };
  const scene = {
    ghosts: [],
    nodes: [root, a, b, c],
    edges,
    top: [],
    layout,
    iconUv: (url) => (url === "a.png" ? [0, 0, 0.5, 0.5] : null),
  };
  const snapshot = (data) => ({
    nodes: [...data.nodes.data.subarray(0, data.nodes.length)],
    edges: [...data.edges.data.subarray(0, data.edges.length)],
    arrows: [...data.arrows.get("triangle").data.subarray(0, 9 * 3)],
  });

  const incremental = new InstanceData();
  incremental.rebuild(scene);
  incremental.nodes.takeDirty();
  incremental.edges.takeDirty();

  // b glows and slides right; its two edges follow. a, c and e1 stay untouched.
  b.glow.value = 0.6;
  b.scale.value = 1.06;
  b.px.value = 215;
  assert.equal(incremental.update(new Set([b]), scene), true);
  const nodesDirty = incremental.nodes.takeDirty();
  assert.deepEqual(nodesDirty, [2 * NODE_FLOATS, 3 * NODE_FLOATS]);
  assert.equal(edges[0].routeKey[2], 0, "e1 was not re-routed");

  const full = new InstanceData();
  full.rebuild(scene);
  assert.deepEqual(snapshot(incremental), snapshot(full));

  // Lifting a node (hover, selection) needs no rebuild: its slot hides it and the top run draws it last.
  const lifted = { ...scene, top: ["b"] };
  assert.equal(incremental.update(new Set(), lifted), true);
  const alphaAt = (list, slot) => list.data[slot * NODE_FLOATS + 32];
  assert.equal(alphaAt(incremental.nodes, b.slot), 0, "hidden in its slot");
  assert.equal(incremental.topNodes.length, NODE_FLOATS);
  assert.equal(incremental.topNodes.data[0], b.px.value, "drawn on top");
  const liftedFull = new InstanceData();
  liftedFull.rebuild(lifted);
  assert.deepEqual(snapshot(incremental), snapshot(liftedFull));
  // Selected and hovered being the same node is still one node on top; dropping it shows its slot again.
  assert.equal(
    incremental.update(new Set([b]), { ...scene, top: ["b", "b"] }),
    true,
  );
  assert.equal(incremental.update(new Set(), scene), true);
  assert.equal(alphaAt(incremental.nodes, b.slot), 1);
  assert.equal(incremental.topNodes.length, 0);
  // An edge bending into a different number of pieces (b→c was straight) needs a rebuild…
  b.py.value = 95;
  assert.equal(incremental.update(new Set([b]), scene), false);
  // …or fading out of sight.
  b.py.value = 80;
  incremental.rebuild(scene);
  edges[2].alpha.value = 0;
  assert.equal(incremental.update(new Set([edges[2]]), scene), false);
  // Records from an older graph are skipped.
  const gone = node("gone", 0, 0);
  assert.equal(incremental.update(new Set([gone]), scene), true);
});

test("lineage emphasis: a colour tints the edge; without one (lineageColor: edge) it keeps its own, only wider", () => {
  const value = (v) => ({ value: v });
  const node = (id, x) => ({
    id,
    px: value(x),
    py: value(0),
    alpha: value(1),
    scale: value(1),
    glow: value(0),
    hw: 20,
    hh: 20,
    fill: [0, 0, 0, 1],
    border: [1, 1, 1, 1],
    aura: [0, 0, 0, 0],
    ring: [0, 0, 0, 0],
    glowColor: [1, 1, 1],
    style: {},
  });
  const drawn = (state) => {
    const edge = {
      id: "e",
      source: node("a", 0),
      target: node("b", 200),
      alpha: value(1),
      emphasis: value(1),
      emphasisState: state,
      color: [0, 1, 0],
      style: { width: 2 },
    };
    const data = new InstanceData();
    data.rebuild({
      ghosts: [],
      nodes: [edge.source, edge.target],
      edges: [edge],
      top: [],
      layout: { routing: "straight" },
      iconUv: () => null,
    });
    const d = data.edges.data;
    return { color: [...d.subarray(4, 7)], width: d[8] };
  };
  const themed = drawn({ color: "#ff0000", boost: 1.4 });
  assert.deepEqual(themed.color, [1, 0, 0]);
  const own = drawn({ color: null, boost: 1.4 });
  assert.deepEqual(own.color, [0, 1, 0]);
  assert.equal(own.width, themed.width);
  assert.ok(own.width > 2);
});
