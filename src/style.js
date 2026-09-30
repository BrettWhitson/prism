import {
  checkField,
  defaultsOf,
  describeSchema,
  isDirectionalLayout,
  isHorizontalDirection,
  resolve,
  treeDirection,
} from "tether/index.js";

/**
 * Prism's look: an element's classes + data + the options + the theme → the plain values the renderer draws. States
 * read as an aura, a ring, a badge or a card stack; interaction states (hover, selection, lineage, highlights) aren't
 * here at all: the renderer animates those itself. Pure: no DOM.
 *
 * Two classes are built in: "root" (bigger, bold, its label wins) and "collapsed" (a card stack: there's more
 * inside). Every other class means whatever the caller's rules say (GraphView.setClassStyles).
 *
 * The order, each step able to change any style field: options and theme → built-in classes → class rules (in
 * their own order) → the node's or edge's own `style` → the nodeStyle / edgeStyle hook (options).
 */

/** @returns {import('tether/index.js').Field} */
const color = (label, value, hint) => ({
  type: "color",
  group: "Theme",
  label,
  default: value,
  hint,
});

/** Every colour Prism draws with. Pass a partial theme to GraphView (or setTheme) to change any of them. */
export const THEME_SCHEMA = Object.freeze({
  node: color(
    "Node",
    "#8a93a6",
    "A node's colour (border, tint) when its data has none.",
  ),
  nodeFill: color(
    "Node fill",
    "#1a2030",
    "Inside nodes (unless tintNodeFill).",
  ),
  edge: color("Edge", "#3b4558", "Edges (edgeColorMode: neutral)."),
  ancestors: color(
    "Ancestors",
    "#d6a74a",
    "Lit edges toward the root, on hover or selection.",
  ),
  descendants: color("Descendants", "#62a4da", "Lit edges away from the root."),
  highlight: color("Highlight", "#ffd166", "setHighlightedNodes() glow."),
  focus: color("Focus", "#62a4da", "flash() glow."),
  selected: color("Selected", "#f0c46a", "The selected node's glow."),
  hover: color("Hover", "#cfd8ea", "The hovered node's glow."),
  labelText: color("Label text", "#e3e6ec", "Node labels."),
  edgeLabelText: color("Edge label text", "#8a93a6", "Edge labels."),
  labelBackdrop: color(
    "Label backdrop",
    "rgba(11, 14, 20, 0.8)",
    "Behind node labels (labelBackdrop).",
  ),
  edgeLabelBackdrop: color(
    "Edge label backdrop",
    "rgba(13, 16, 23, 0.9)",
    "Behind edge labels.",
  ),
});

/**
 * @typedef {{ node: string, nodeFill: string, edge: string, ancestors: string, descendants: string,
 *             highlight: string, focus: string, selected: string, hover: string, labelText: string,
 *             edgeLabelText: string, labelBackdrop: string, edgeLabelBackdrop: string }} Theme
 */

/** @type {Readonly<Theme>} */
export const DEFAULT_THEME = Object.freeze(defaultsOf(THEME_SCHEMA));

/** The theme as a list, for settings UIs. */
export const THEME_OPTIONS = Object.freeze(describeSchema(THEME_SCHEMA));

/** The theme colours the renderer draws interaction and labels with (WebGLGraph's colors). */
export const RENDERER_COLOR_KEYS = Object.freeze([
  "selected",
  "hover",
  "labelText",
  "edgeLabelText",
  "labelBackdrop",
  "edgeLabelBackdrop",
]);

/**
 * `patch` checked against the theme schema, on top of `base` (default: the default theme).
 * @param {Partial<Theme>} patch
 * @param {{ base?: Theme, strict?: boolean, warn?: (message: string) => void }} [options]
 * @returns {Theme}
 */
export function resolveTheme(patch, options = {}) {
  return resolve(THEME_SCHEMA, patch, { scope: "Prism theme", ...options });
}

/**
 * What the renderer draws for a node. Class rules, a node's `style` and the nodeStyle hook can set any of it.
 * @typedef {object} NodeStyle
 * @property {number} size  width and height, before any scaling for hover or drag
 * @property {string} shape  a built-in or registered shape
 * @property {string} fill
 * @property {number} fillAlpha
 * @property {string} border
 * @property {number} borderWidth
 * @property {"solid" | "dashed" | "dotted" | "stack"} pattern  stack: a card peeking out behind (there's more inside)
 * @property {number} iconAlpha
 * @property {string | null} aura  a soft glow around the node for a standing state
 * @property {string | null} ring  a thin ring just outside the border
 * @property {boolean} badge  the renderer's badge image in the corner (its badgeUrl)
 * @property {string} label
 * @property {number} fontSize
 * @property {boolean} bold
 * @property {number} labelPriority  labels that stay when zoomed out and win label collisions
 * @property {boolean} events  false: the pointer passes through (no hover, tap or drag); still drawn and labelled
 * @property {string | null} [icon]  the icon's URL (the node's `icon`)
 */

/**
 * What the renderer draws for an edge.
 * @typedef {object} EdgeStyle
 * @property {string} color
 * @property {number} width
 * @property {number} alpha
 * @property {"dashed" | "dotted" | null} pattern
 * @property {string | null} arrowAtSource
 * @property {string | null} arrowAtTarget
 * @property {number} arrowScale
 * @property {string} label
 * @property {number} fontSize
 * @property {boolean} glow  a soft glow under the line (standing emphasis)
 */

/**
 * @typedef {Partial<NodeStyle>} NodeRule
 * @typedef {Partial<EdgeStyle>} EdgeRule
 * @typedef {{ nodes?: Record<string, NodeRule>, edges?: Record<string, EdgeRule> }} ClassRules
 */

/** @returns {import('tether/index.js').Field} */
const field = (type, extra = {}) => ({ type, default: undefined, ...extra });

/**
 * What each style field may be, for checking class rules, an element's own `style` and the hooks. No defaults: a
 * value that can't be used is left out (the style keeps what it had), and a number out of range is clamped.
 */
export const NODE_STYLE_SCHEMA = Object.freeze({
  size: field("number", { min: 1, max: 100000 }), // at least 1: a node never vanishes
  shape: field("string"),
  fill: field("color"),
  fillAlpha: field("number", { min: 0, max: 1 }),
  border: field("color"),
  borderWidth: field("number", { min: 0, max: 1000 }),
  pattern: field("enum", { values: ["solid", "dashed", "dotted", "stack"] }),
  iconAlpha: field("number", { min: 0, max: 1 }),
  aura: field("color", { nullable: true }),
  ring: field("color", { nullable: true }),
  badge: field("boolean"),
  label: field("string"),
  fontSize: field("number", { min: 0, max: 1000 }),
  bold: field("boolean"),
  labelPriority: field("number"),
  events: field("boolean"),
  icon: field("string", { nullable: true }),
});

export const EDGE_STYLE_SCHEMA = Object.freeze({
  color: field("color"),
  width: field("number", { min: 0, max: 1000 }),
  alpha: field("number", { min: 0, max: 1 }),
  pattern: field("enum", { values: ["dashed", "dotted"], nullable: true }),
  arrowAtSource: field("string", { nullable: true }),
  arrowAtTarget: field("string", { nullable: true }),
  arrowScale: field("number", { min: 0, max: 100 }),
  label: field("string"),
  fontSize: field("number", { min: 0, max: 1000 }),
  glow: field("boolean"),
});

const warned = new Set();
function warnStyle(message) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

function describe(value) {
  if (typeof value === "function") return "a function";
  const text = JSON.stringify(value) ?? String(value);
  return text.length > 40 ? `${text.slice(0, 37)}…` : text;
}

/**
 * Copy `changes` onto `style`, checked against `schema`: unknown fields and unusable values are left out, numbers out
 * of range clamped, each problem warned about once (per source, field and problem). null clears the fields that can
 * be "none" (aura, ring, an edge's pattern and arrowheads) and is ignored elsewhere.
 * @param {string} source  where the changes came from, for the warning
 */
function applyStyle(style, changes, schema, source) {
  if (!changes || typeof changes !== "object") return;
  for (const key of Object.keys(changes)) {
    const value = changes[key];
    if (value === undefined) continue;
    const rule = schema[key];
    if (!rule) {
      warnStyle(`Prism: ${source}: unknown style field "${key}" (ignored)`);
      continue;
    }
    if (value === null) {
      if (rule.nullable) style[key] = null;
      continue;
    }
    const checked = checkField(rule, value);
    if (checked.problem) {
      warnStyle(
        `Prism: ${source}: "${key}" ${checked.problem}; got ${describe(value)}, ${checked.value === undefined ? "ignored" : `using ${describe(checked.value)}`}`,
      );
      if (checked.value === undefined) continue;
    }
    style[key] = checked.value;
  }
}

/** "auto" puts labels where the layout leaves room: beside horizontal trees, below everything else. */
export function resolveLabelPosition(o) {
  if (o.labelPosition !== "auto") return o.labelPosition;
  if (!isDirectionalLayout(o)) return "below";
  const growth = treeDirection(o.direction);
  return growth === "LR" ? "right" : growth === "RL" ? "left" : "below";
}

/**
 * The renderer's routing: "straight", "taxi", "round-taxi", "s-curve" (bends along the flow), "arc", or a routing
 * added with registerEdgeRouting (passed through as it is). Right angles need a direction, so layouts without one
 * get arcs instead.
 */
export function resolveRouting(o) {
  const builtIn = ["straight", "taxi", "round-taxi", "curved"];
  if (!builtIn.includes(o.edgeRouting)) return o.edgeRouting;
  if (o.edgeRouting === "straight") return "straight";
  const radial = !isDirectionalLayout(o);
  if (o.edgeRouting === "curved") return radial ? "arc" : "s-curve";
  if (radial) return "arc";
  return o.edgeRouting === "round-taxi" ? "round-taxi" : "taxi";
}

/** The axis a directional layout spreads its levels along. */
export function resolveFlowAxis(o) {
  return isHorizontalDirection(o.direction) ? "x" : "y";
}

/**
 * @param {Set<string>} classes
 * @param {{ color?: string, label?: string, style?: NodeRule }} data  the node (its `style`: its own overrides)
 * @param {import('./options.js').Options} o
 * @param {Theme} theme
 * @param {ClassRules} [rules]  per class, applied in their own order
 * @returns {NodeStyle}
 */
export function resolveNodeStyle(classes, data, o, theme, rules = {}) {
  const color = data.color ?? theme.node;
  /** @type {NodeStyle} */
  const style = {
    size: o.nodeSize * o.nodeSizeScale,
    shape: o.nodeShape,
    fill: o.tintNodeFill ? color : theme.nodeFill,
    fillAlpha: o.tintNodeFill ? o.tintFillAlpha : 1,
    border: color,
    borderWidth: o.nodeBorderWidth,
    pattern: "solid",
    iconAlpha: o.showIcons ? 1 : 0,
    aura: null,
    ring: null,
    badge: false,
    label: o.showLabels ? (data.label ?? "") : "",
    fontSize: o.fontSize * o.labelFontScale,
    bold: false,
    labelPriority: 0,
    events: true,
  };
  if (classes.has("root")) {
    style.size *= o.rootSizeScale;
    style.borderWidth += o.rootBorderBoost;
    style.fontSize *= o.rootFontScale;
    style.bold = true;
    style.labelPriority = 3;
  }
  if (classes.has("collapsed")) style.pattern = "stack";
  for (const [name, rule] of Object.entries(rules.nodes ?? {}))
    if (classes.has(name))
      applyStyle(style, rule, NODE_STYLE_SCHEMA, `node class "${name}"`);
  applyStyle(style, data.style, NODE_STYLE_SCHEMA, "a node's style");
  if (o.nodeStyle)
    applyStyle(
      style,
      o.nodeStyle(/** @type {any} */ (data), style),
      NODE_STYLE_SCHEMA,
      "the nodeStyle hook",
    );
  return style;
}

/**
 * @param {Set<string>} classes
 * @param {{ label?: string, sourceColor?: string, targetColor?: string, style?: EdgeRule }} data
 * @param {import('./options.js').Options} o
 * @param {Theme} theme
 * @param {ClassRules} [rules]
 * @returns {EdgeStyle}
 */
export function resolveEdgeStyle(classes, data, o, theme, rules = {}) {
  const color =
    o.edgeColorMode === "target"
      ? (data.targetColor ?? theme.edge)
      : o.edgeColorMode === "source"
        ? (data.sourceColor ?? theme.edge)
        : theme.edge;
  const arrow = o.showArrows ? o.arrowShape : null;
  /** @type {EdgeStyle} */
  const style = {
    color,
    width: o.edgeWidth,
    alpha: o.edgeOpacity,
    pattern:
      o.edgeLineStyle === "dashed" || o.edgeLineStyle === "dotted"
        ? o.edgeLineStyle
        : null,
    arrowAtSource: o.arrowEnd !== "target" ? arrow : null,
    arrowAtTarget: o.arrowEnd !== "source" ? arrow : null,
    arrowScale: o.arrowScale,
    label: o.edgeLabels ? (data.label ?? "") : "",
    fontSize: o.fontSize * o.labelFontScale - 1,
    glow: false,
  };
  for (const [name, rule] of Object.entries(rules.edges ?? {}))
    if (classes.has(name))
      applyStyle(style, rule, EDGE_STYLE_SCHEMA, `edge class "${name}"`);
  applyStyle(style, data.style, EDGE_STYLE_SCHEMA, "an edge's style");
  if (o.edgeStyle)
    applyStyle(
      style,
      o.edgeStyle(/** @type {any} */ (data), style),
      EDGE_STYLE_SCHEMA,
      "the edgeStyle hook",
    );
  return style;
}
