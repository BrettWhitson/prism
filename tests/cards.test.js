// Card nodes without a browser: their style defaults, the checks on their fields, and the text layout.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME,
  resolveEdgeStyle,
  resolveNodeStyle,
  resolveOptions,
} from "../src/index.js";
import { InstanceData } from "../src/render/instance-data.js";
import {
  cardTextLayout,
  ellipsize,
  isRichText,
  toRuns,
} from "../src/render/card-text.js";

function capture(fn) {
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(String(message));
  try {
    return { result: fn(), warnings };
  } finally {
    console.warn = original;
  }
}

test("icon look: the default, with width and height equal to the size and no card parts", () => {
  const o = resolveOptions({});
  assert.equal(o.nodeLook, "icon");
  const style = resolveNodeStyle(
    new Set(["root"]),
    { color: "#123456" },
    o,
    DEFAULT_THEME,
  );
  assert.equal(style.look, "icon");
  assert.equal(style.width, style.size);
  assert.equal(style.height, style.size);
  assert.equal(style.stripe, null);
  assert.equal(style.portIn, null);
  assert.equal(style.border, "#123456");
});

test("card look: the card's size, a quiet border, the node's colour on the stripe and ports, the text slots", () => {
  const o = resolveOptions({ nodeLook: "card", cardHeight: 50 });
  const style = resolveNodeStyle(
    new Set(["root"]),
    {
      color: "#a335ee",
      label: "Bolt",
      subtitle: ["×1 ", { mark: "#c678dd" }, " Forge"],
      value: "2,199",
      tag: "✓ 2 owned",
    },
    o,
    DEFAULT_THEME,
  );
  assert.equal(style.look, "card");
  assert.deepEqual([style.width, style.height], [222, 50]);
  assert.equal(style.border, DEFAULT_THEME.cardBorder);
  assert.equal(style.borderWidth, 1);
  assert.equal(style.stripe, "#a335ee");
  assert.equal(style.portOut, "#a335ee");
  assert.equal(style.fontSize, o.cardTitleSize); // the root isn't scaled up as a card
  assert.equal(style.bold, true);
  assert.equal(style.tag, "✓ 2 owned");
  assert.equal(style.subtitle.length, 3);
});

test("a class rule or hook can switch one node's look; its box follows", () => {
  const o = resolveOptions({
    nodeStyle: (node) => (node.big ? { look: "card", stripe: null } : null),
  });
  const card = resolveNodeStyle(new Set(), { big: true }, o, DEFAULT_THEME);
  assert.equal(card.look, "card");
  assert.equal(card.width, o.cardWidth);
  assert.equal(card.stripe, null);
  const icon = resolveNodeStyle(new Set(), {}, o, DEFAULT_THEME);
  assert.equal(icon.width, o.nodeSize);
  const sized = resolveNodeStyle(
    new Set(),
    { style: { width: 300 } },
    resolveOptions({ nodeLook: "card" }),
    DEFAULT_THEME,
  );
  assert.equal(sized.width, 300);
});

test("card fields are checked: runs, colours, sizes", () => {
  const { result, warnings } = capture(() =>
    resolveNodeStyle(
      new Set(),
      {
        style: {
          subtitle: [{ nope: 1 }],
          value: 42,
          stripe: "rgb(1,2)",
          portSize: -3,
          look: "tile",
        },
      },
      resolveOptions({ nodeLook: "card" }),
      DEFAULT_THEME,
    ),
  );
  assert.equal(result.subtitle, "");
  assert.equal(result.value, "");
  assert.equal(result.portSize, 0);
  assert.equal(result.look, "card");
  assert.equal(warnings.length, 5);
});

test("rich text: strings and runs", () => {
  assert.ok(isRichText("x"));
  assert.ok(
    isRichText([
      "a",
      { text: "b", color: "#fff" },
      { mark: "#f00" },
      { dot: "#0f0" },
    ]),
  );
  assert.ok(!isRichText([{ text: 3 }]));
  assert.ok(!isRichText(42));
  assert.deepEqual(toRuns(""), []);
  assert.deepEqual(toRuns(["", "a", null]), ["a"]);
});

test("card text layout: the lines present, centred, in order", () => {
  const base = {
    width: 222,
    height: 64,
    title: "Bolt",
    titleSize: 12.5,
    subtitleSize: 11,
    valueSize: 12,
  };
  const three = cardTextLayout({ ...base, subtitle: "×1", value: "2" });
  assert.deepEqual(
    three.map((line) => line.kind),
    ["title", "subtitle", "value"],
  );
  assert.ok(three[0].y < three[1].y && three[1].y < three[2].y);
  const middle =
    (three[0].y - three[0].size * 0.66 + three[2].y + three[2].size * 0.66) / 2;
  assert.ok(Math.abs(middle - 32) < 0.01);
  const one = cardTextLayout(base);
  assert.equal(one.length, 1);
  assert.equal(one[0].y, 32);
});

test("ellipsize: fits the width, ends in an ellipsis when cut", () => {
  const context = { measureText: (text) => ({ width: [...text].length * 10 }) };
  assert.equal(ellipsize(context, "short", 100), "short");
  assert.equal(ellipsize(context, "a long title", 60), "a lon…");
  assert.equal(ellipsize(context, "abc", 5), "");
});

test("the arrows pattern points the way flowToward says", () => {
  const toTarget = resolveEdgeStyle(
    new Set(),
    {},
    resolveOptions({ edgeLineStyle: "arrows" }),
    DEFAULT_THEME,
  );
  assert.equal(toTarget.pattern, "arrows");
  assert.equal(toTarget.patternToward, "target");
  const toSource = resolveEdgeStyle(
    new Set(),
    {},
    resolveOptions({ edgeLineStyle: "arrows", flowToward: "source" }),
    DEFAULT_THEME,
  );
  assert.equal(toSource.patternToward, "source");
});

test("edges stop at a card's port rim, so an arrowhead shows beside the dot", () => {
  const value = (v) => ({ value: v });
  const record = (id, x, style) => ({
    id,
    px: value(x),
    py: value(0),
    alpha: value(1),
    scale: value(1),
    glow: value(0),
    hw: 111,
    hh: 32,
    fill: [0, 0, 0, 1],
    border: [1, 1, 1, 1],
    aura: [0, 0, 0, 0],
    ring: [0, 0, 0, 0],
    glowColor: [1, 1, 1],
    style,
  });
  const card = { look: "card", portSize: 8, portIn: "#fff", portOut: "#fff" };
  const route = (targetStyle) => {
    const edge = {
      id: "e",
      source: record("root", 400, { ...card }),
      target: record("leaf", 0, targetStyle),
      alpha: value(1),
      emphasis: value(0),
      color: [1, 1, 1],
      style: { width: 2 },
    };
    const data = new InstanceData();
    data.rebuild({
      ghosts: [],
      nodes: [edge.source, edge.target],
      edges: [edge],
      top: [],
      layout: { routing: "taxi", flowAxis: "x", portDirection: { x: 1, y: 0 } },
      iconUv: () => null,
    });
    return edge.route;
  };
  // LR: the root is on the right; the edge leaves the root's in port (its left) and reaches the leaf's out port.
  const withPorts = route({ ...card });
  assert.equal(withPorts[0].x, 400 - 111 - 5);
  assert.equal(withPorts.at(-1).x, 111 + 5);
  const noPort = route({ ...card, portOut: null });
  assert.equal(noPort.at(-1).x, 111);
  const icon = route({ look: "icon" });
  assert.equal(icon.at(-1).x, 111);
});
