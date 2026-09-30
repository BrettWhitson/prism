/**
 * The renderer's extension points: node shapes, arrowheads, edge routings and animation feels, by name. Registries
 * are global (every renderer on the page sees them) and versioned, so a renderer that's already drawing picks up a
 * new shape on its next frame (recompiling its node shader).
 *
 *   registerNodeShape("star", { polygon: starPoints(5, 0.45) });  // no GLSL needed
 *   registerNodeShape("pill", { glsl: "vec2 d = abs(p) - h + min(h.x, h.y); return length(max(d, 0.0)) - min(h.x, h.y);" });
 *   registerArrowShape("diamond", { triangles: [[0, 0], [0.5, -0.4], [1, 0], [0, 0], [1, 0], [0.5, 0.4]], inset: 1 });
 *   registerEdgeRouting("zigzag", (source, target) => [...points]);
 *   registerEasing("lazy", { speed: 4, damping: 1 });
 *
 * Pure: no DOM, no GL (the renderer compiles what's registered here).
 */
/** How many vertices a polygon shape may have (a fixed-size array in the shader). */
export declare const MAX_POLYGON_VERTICES = 64;
/** Changes whenever anything is registered: renderers compare it to what they last built. */
export declare function pluginVersion(): number;
/**
 * Add a node shape (or replace a custom one), usable as `nodeShape` or a style's `shape`.
 *
 * - `{ polygon: [[x, y], …], rounding? }`: an outline in a unit box (-1..1 on both axes, y down), 3 to 64 points, in
 *   order, convex or not. It's stretched to the node's box. `rounding` (0..1) rounds its corners.
 * - `{ glsl: "…" }`: the body of `float shape(vec2 p, vec2 h)`, returning the signed distance (negative inside) from
 *   `p` (relative to the node's centre, y down) to a shape filling the half-size box `h`. For curves and anything a
 *   polygon can't do. If it doesn't compile, the renderer warns and draws the default shape instead.
 * @param {string} name
 * @param {{ polygon: [number, number][], rounding?: number } | { glsl: string }} definition
 */
export declare function registerNodeShape(
  name: string,
  definition:
    | {
        polygon: [number, number][];
        rounding?: number;
      }
    | {
        glsl: string;
      },
): void;
/** The shader id of a shape name (unknown names: the round rectangle). */
export declare function shapeId(name: any): any;
/** Every shape name, built-in and custom. */
export declare function nodeShapeNames(): string[];
/**
 * The custom shapes as GLSL: their functions, and the dispatch for shapeDistance (see shaders.js). `skip`: names to
 * leave out (they failed to compile).
 */
export declare function customShapeGlsl(skip?: Set<any>): {
  functions: string;
  dispatch: string;
};
/** The names of the custom shapes written in GLSL (the ones that might not compile). */
export declare function glslShapeNames(): string[];
/**
 * Add an arrowhead (or replace one, built-ins included), usable as `arrowShape`. `triangles`: a flat list of
 * triangle corners [back, side] in arrow sizes, with the tip at [0, 0] and `back` running back along the edge;
 * `inset`: how far back the line stops so it doesn't poke through the tip.
 * @param {string} name
 * @param {{ triangles: [number, number][], inset?: number }} definition
 */
export declare function registerArrowShape(
  name: string,
  {
    triangles,
    inset,
  }?: {
    triangles: [number, number][];
    inset?: number;
  },
): void;
/** A registered arrowhead, or undefined (then the built-ins apply). */
export declare function customArrow(name: any): {
  triangles: [number, number][];
  inset: number;
};
export type EdgeRouter = (
  source: {
    x: number;
    y: number;
    hw: number;
    hh: number;
  },
  target: {
    x: number;
    y: number;
    hw: number;
    hh: number;
  },
  context: {
    flowAxis: string;
    cornerRadius: number;
    curvature: number;
  },
) => {
  x: number;
  y: number;
}[];
/**
 * Add an edge routing (or replace one), usable as `edgeRouting`. The router gets both ends (centre and half-size)
 * and returns the edge as a polyline, at least two points, from the source's border to the target's.
 * @param {string} name
 * @param {EdgeRouter} route
 */
export declare function registerEdgeRouting(
  name: string,
  route: EdgeRouter,
): void;
/** @returns {EdgeRouter | undefined} */
export declare function customRouter(name: any): EdgeRouter | undefined;
export declare function edgeRoutingNames(): string[];
/**
 * Add an animation feel (or replace one), usable as `animationEasing`. Every motion is a spring that settles in
 * about the animation duration: `speed` sets how quickly it gets going (higher is snappier), `damping` whether it
 * overshoots (1 doesn't; 0.3 wobbles; 1.5 glides in).
 * @param {string} name
 * @param {{ speed: number, damping: number }} feel
 */
export declare function registerEasing(
  name: string,
  {
    speed,
    damping,
  }?: {
    speed: number;
    damping: number;
  },
): void;
/** @returns {{ speed: number, damping: number }} (unknown names: smooth) */
export declare function easing(name: any): {
  speed: number;
  damping: number;
};
export declare function easingNames(): string[];
