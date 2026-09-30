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
};
/**
 * @typedef {{ node: string, nodeFill: string, edge: string, ancestors: string, descendants: string,
 *             highlight: string, focus: string, selected: string, hover: string, labelText: string,
 *             edgeLabelText: string, labelBackdrop: string, edgeLabelBackdrop: string }} Theme
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
