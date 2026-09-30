/**
 * Edge shapes as line segments, for drawing and for bounds. Pure: no DOM.
 *
 * Edges attach to node boxes, not centres, so arrowheads sit on the border. "taxi" edges run in three straight pieces
 * (out along the flow, across, then in), like an org chart.
 */
/** Where the line from (cx, cy) toward (tx, ty) leaves a box of half-size hw × hh centred at (cx, cy). */
export declare function boxExit(
  cx: any,
  cy: any,
  hw: any,
  hh: any,
  tx: any,
  ty: any,
): {
  x: any;
  y: any;
};
/**
 * The points of an edge from `source` to `target` (each `{ x, y, hw, hh }`), as a polyline.
 * @param {string} routing  "straight" or "taxi"
 * @param {string} flowAxis  for taxi: "x" or "y", the axis levels are spread along
 * @returns {{ x: number, y: number }[]}
 */
export declare function edgePoints(
  source: any,
  target: any,
  routing?: string,
  flowAxis?: string,
): {
  x: number;
  y: number;
}[];
/**
 * Any routing the renderer draws, as a polyline from `source` to `target` (each `{ x, y, hw, hh }`):
 *  - "straight", "taxi": as edgePoints;
 *  - "round-taxi": taxi with its corners rounded to `cornerRadius`;
 *  - "s-curve": leaves and enters along the flow axis, bending halfway;
 *  - "arc": a gentle bow, `curvature` × 15% of the length off the straight line.
 * Curves come back as short straight pieces, fine enough to look smooth.
 */
export declare function edgeRoute(
  source: any,
  target: any,
  {
    routing,
    flowAxis,
    cornerRadius,
    curvature,
  }?: {
    cornerRadius?: number;
    curvature?: number;
    flowAxis?: string;
    routing?: string;
  },
): any;
/** A polyline with each inner corner swapped for a curve of up to `radius` (less where the pieces are short). */
export declare function roundCorners(points: any, radius: any): any;
export declare function polylineLength(points: any): number;
/** The point `distance` along a polyline (clamped to its ends). */
export declare function pointAlong(points: any, distance: any): any;
/**
 * Arrowheads are drawn at a constant on-screen size, like the lines. Each shape is a set of triangles in a unit frame
 * at the tip: `back` runs from the tip back along the edge, `side` across it. `inset` is how far (in the same units)
 * the line stops short of the tip so it never pokes through.
 * Shapes: triangle, vee, chevron, triangle-backcurve, circle, square, tee.
 * @returns {{ triangles: [number, number][], inset: number }}
 */
export declare function arrowTemplate(shape: any): {
  triangles: [number, number][];
  inset: number;
};
/** An arrowhead's three corners at `tip`, pointing away from `from`, `size` long and as wide. */
export declare function arrowHead(from: any, tip: any, size: any): any[];
/** Bounding box of a polyline, padded by `pad`. */
export declare function pointsBounds(
  points: any,
  pad?: number,
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
