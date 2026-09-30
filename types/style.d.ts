/** Every colour Prism draws with. Pass a partial theme to GraphView (or setTheme) to change any of them. */
export declare const THEME_SCHEMA: Readonly<{
  node: import("tether/schema.js").Field;
  nodeFill: import("tether/schema.js").Field;
  edge: import("tether/schema.js").Field;
  ancestors: import("tether/schema.js").Field;
  descendants: import("tether/schema.js").Field;
  highlight: import("tether/schema.js").Field;
  focus: import("tether/schema.js").Field;
  selected: import("tether/schema.js").Field;
  hover: import("tether/schema.js").Field;
  labelText: import("tether/schema.js").Field;
  edgeLabelText: import("tether/schema.js").Field;
  labelBackdrop: import("tether/schema.js").Field;
  edgeLabelBackdrop: import("tether/schema.js").Field;
  cardBorder: import("tether/schema.js").Field;
  cardText: import("tether/schema.js").Field;
  cardMuted: import("tether/schema.js").Field;
  portFill: import("tether/schema.js").Field;
}>;
export type Theme = {
  node: string;
  nodeFill: string;
  edge: string;
  ancestors: string;
  descendants: string;
  highlight: string;
  focus: string;
  selected: string;
  hover: string;
  labelText: string;
  edgeLabelText: string;
  labelBackdrop: string;
  edgeLabelBackdrop: string;
  cardBorder: string;
  cardText: string;
  cardMuted: string;
  portFill: string;
};
/**
 * @typedef {{ node: string, nodeFill: string, edge: string, ancestors: string, descendants: string,
 *             highlight: string, focus: string, selected: string, hover: string, labelText: string,
 *             edgeLabelText: string, labelBackdrop: string, edgeLabelBackdrop: string, cardBorder: string,
 *             cardText: string, cardMuted: string, portFill: string }} Theme
 */
/** @type {Readonly<Theme>} */
export declare const DEFAULT_THEME: Readonly<Theme>;
/** The theme as a list, for settings UIs. */
export declare const THEME_OPTIONS: readonly (import("tether/schema.js").Field & {
  key: string;
})[];
/** The theme colours the renderer draws interaction and labels with (WebGLGraph's colors). */
export declare const RENDERER_COLOR_KEYS: readonly string[];
/**
 * `patch` checked against the theme schema, on top of `base` (default: the default theme).
 * @param {Partial<Theme>} patch
 * @param {{ base?: Theme, strict?: boolean, warn?: (message: string) => void }} [options]
 * @returns {Theme}
 */
export declare function resolveTheme(
  patch: Partial<Theme>,
  options?: {
    base?: Theme;
    strict?: boolean;
    warn?: (message: string) => void;
  },
): Theme;
export type NodeStyle = {
  /**
   * width and height, before any scaling for hover or drag
   */
  size: number;
  /**
   * a built-in or registered shape
   */
  shape: string;
  fill: string;
  fillAlpha: number;
  border: string;
  borderWidth: number;
  /**
   * stack: a card peeking out behind (there's more inside)
   */
  pattern: "solid" | "dashed" | "dotted" | "stack";
  iconAlpha: number;
  /**
   * a soft glow around the node for a standing state
   */
  aura: string | null;
  /**
   * a thin ring just outside the border
   */
  ring: string | null;
  /**
   * the renderer's badge image in the corner (its badgeUrl)
   */
  badge: boolean;
  label: string;
  fontSize: number;
  bold: boolean;
  /**
   * labels that stay when zoomed out and win label collisions
   */
  labelPriority: number;
  /**
   * false: the pointer passes through (no hover, tap or drag); still drawn and labelled
   */
  events: boolean;
  /**
   * the icon's URL (the node's `icon`)
   */
  icon?: string | null;
  /**
   * from the nodeLook option; a class rule or hook can change it per node
   */
  look: "icon" | "card";
  /**
   * the box (graph units): for icons, `size` unless set; for cards, cardWidth
   */
  width: number;
  height: number;
  /**
   * cards: the colour stripe down the left edge (default: the node's colour)
   */
  stripe: string | null;
  /**
   * cards: the port dot on the leaf side of the flow, or null (default: the node's
   * colour, where the node has children)
   */
  portIn: string | null;
  /**
   * cards: the port dot on the root side, or null (default: the node's colour, where
   * the node has a parent)
   */
  portOut: string | null;
  /**
   * cards: the second line (the node's `subtitle`)
   */
  subtitle: import("./render/card-text.js").RichText;
  /**
   * cards: the third line (the node's `value`)
   */
  value: import("./render/card-text.js").RichText;
  /**
   * cards: a pill on the top edge, top right (the node's `tag`)
   */
  tag: string;
  tagColor: string | null;
  valueColor: string | null;
  /**
   * cards: the icon's size, its inset from the left, the stripe and port sizes, and the
   * subtitle and value font sizes, from the card options
   */
  iconSize: number;
  iconInset: number;
  stripeWidth: number;
  stripeInset: number;
  portSize: number;
  subtitleSize: number;
  valueSize: number;
  cardPadding: number;
};
export type EdgeStyle = {
  color: string;
  width: number;
  alpha: number;
  pattern: "dashed" | "dotted" | null;
  arrowAtSource: string | null;
  arrowAtTarget: string | null;
  arrowScale: number;
  label: string;
  fontSize: number;
  /**
   * a soft glow under the line (standing emphasis)
   */
  glow: boolean;
};
export type NodeRule = Partial<NodeStyle>;
export type EdgeRule = Partial<EdgeStyle>;
export type ClassRules = {
  nodes?: Record<string, NodeRule>;
  edges?: Record<string, EdgeRule>;
};
/**
 * What each style field may be, for checking class rules, an element's own `style` and the hooks. No defaults: a
 * value that can't be used is left out (the style keeps what it had), and a number out of range is clamped.
 */
export declare const NODE_STYLE_SCHEMA: Readonly<{
  size: import("tether/schema.js").Field;
  shape: import("tether/schema.js").Field;
  fill: import("tether/schema.js").Field;
  fillAlpha: import("tether/schema.js").Field;
  border: import("tether/schema.js").Field;
  borderWidth: import("tether/schema.js").Field;
  pattern: import("tether/schema.js").Field;
  iconAlpha: import("tether/schema.js").Field;
  aura: import("tether/schema.js").Field;
  ring: import("tether/schema.js").Field;
  badge: import("tether/schema.js").Field;
  label: import("tether/schema.js").Field;
  fontSize: import("tether/schema.js").Field;
  bold: import("tether/schema.js").Field;
  labelPriority: import("tether/schema.js").Field;
  events: import("tether/schema.js").Field;
  icon: import("tether/schema.js").Field;
  look: import("tether/schema.js").Field;
  width: import("tether/schema.js").Field;
  height: import("tether/schema.js").Field;
  stripe: import("tether/schema.js").Field;
  portIn: import("tether/schema.js").Field;
  portOut: import("tether/schema.js").Field;
  subtitle: import("tether/schema.js").Field;
  value: import("tether/schema.js").Field;
  tag: import("tether/schema.js").Field;
  tagColor: import("tether/schema.js").Field;
  valueColor: import("tether/schema.js").Field;
  iconSize: import("tether/schema.js").Field;
  iconInset: import("tether/schema.js").Field;
  stripeWidth: import("tether/schema.js").Field;
  stripeInset: import("tether/schema.js").Field;
  portSize: import("tether/schema.js").Field;
  subtitleSize: import("tether/schema.js").Field;
  valueSize: import("tether/schema.js").Field;
  cardPadding: import("tether/schema.js").Field;
}>;
export declare const EDGE_STYLE_SCHEMA: Readonly<{
  color: import("tether/schema.js").Field;
  width: import("tether/schema.js").Field;
  alpha: import("tether/schema.js").Field;
  pattern: import("tether/schema.js").Field;
  arrowAtSource: import("tether/schema.js").Field;
  arrowAtTarget: import("tether/schema.js").Field;
  arrowScale: import("tether/schema.js").Field;
  label: import("tether/schema.js").Field;
  fontSize: import("tether/schema.js").Field;
  glow: import("tether/schema.js").Field;
}>;
/** "auto" puts labels where the layout leaves room: beside horizontal trees, below everything else. */
export declare function resolveLabelPosition(o: any): any;
/**
 * The renderer's routing: "straight", "taxi", "round-taxi", "s-curve" (bends along the flow), "arc", or a routing
 * added with registerEdgeRouting (passed through as it is). Right angles need a direction, so layouts without one
 * get arcs instead.
 */
export declare function resolveRouting(o: any): any;
/** The axis a directional layout spreads its levels along. */
export declare function resolveFlowAxis(o: any): "x" | "y";
/**
 * @param {Set<string>} classes
 * @param {{ color?: string, label?: string, style?: NodeRule }} data  the node (its `style`: its own overrides)
 * @param {import('./options.js').Options} o
 * @param {Theme} theme
 * @param {ClassRules} [rules]  per class, applied in their own order
 * @returns {NodeStyle}
 */
export declare function resolveNodeStyle(
  classes: Set<string>,
  data: {
    color?: string;
    label?: string;
    style?: NodeRule;
  },
  o: import("./options.js").Options,
  theme: Theme,
  rules?: ClassRules,
): NodeStyle;
/**
 * @param {Set<string>} classes
 * @param {{ label?: string, sourceColor?: string, targetColor?: string, style?: EdgeRule }} data
 * @param {import('./options.js').Options} o
 * @param {Theme} theme
 * @param {ClassRules} [rules]
 * @returns {EdgeStyle}
 */
export declare function resolveEdgeStyle(
  classes: Set<string>,
  data: {
    label?: string;
    sourceColor?: string;
    targetColor?: string;
    style?: EdgeRule;
  },
  o: import("./options.js").Options,
  theme: Theme,
  rules?: ClassRules,
): EdgeStyle;
