/**
 * The per-instance data the GPU draws from: one run of floats for nodes, one for edge pieces (a polyline segment
 * each) and one per arrowhead shape. Pure: records in, floats out; webgl-graph.js uploads the dirty spans.
 *
 * A full `rebuild` writes everything in draw order and remembers where each record went. While the same things are
 * drawn in the same order, `update` rewrites just the records that changed (a hovered node and its edges) in place,
 * so an animated frame costs what moves, not the size of the graph. When the layout of the data would change (an
 * edge appearing or bending into a different number of pieces) `update` declines and the caller rebuilds.
 *
 * Nodes lifted over the rest (selected, hovered, dragged) keep their slot, hidden there, and are drawn again from
 * `topNodes`, a second small run drawn last: lifting a node rewrites two slots, not the whole order.
 *
 * Node records: { px, py, alpha, scale, glow: { value }, hw, hh, fill, border, aura, ring: [r,g,b,a],
 * glowColor: [r,g,b], style }. Edge records: { source, target, alpha, emphasis: { value }, emphasisState, color,
 * style }. Either may carry a colour fade: `colorMix` ({ value } 0 → 1) from `colorFrom` (the same colour fields) to
 * the current ones. They gain bookkeeping fields (slot, pieceAt, …) from here.
 */
export declare const NODE_FLOATS = 36;
export declare const EDGE_FLOATS = 16;
export declare const ARROW_FLOATS = 9;
/** A growable run of floats: `length` of them used, `data` reused from frame to frame, a dirty span to upload. */
export declare class FloatList {
  data: Float32Array<ArrayBuffer>;
  length: number;
  dirtyFrom: number;
  dirtyTo: number;
  constructor(capacity?: number);
  clear(): this;
  /** Room for `count` more floats after `length`; returns the (possibly new) array to write into. */
  reserve(count: any): Float32Array<ArrayBuffer>;
  markDirty(from: any, to: any): void;
  /** The span written since the last call ([from, to) in floats), or null. */
  takeDirty(): number[];
}
/** Arrowhead size in CSS pixels for an edge of `width`. */
export declare function arrowSize(width: any, arrowScale?: number): number;
export declare class InstanceData {
  #private;
  nodes: FloatList;
  /** The lifted nodes again, drawn after everything else. */
  topNodes: FloatList;
  edges: FloatList;
  /** Arrowhead shape → its instances. */
  arrows: Map<any, any>;
  /** The instances for `shape`'s arrowheads. */
  arrowList(shape: any): any;
  /**
   * Write everything. `scene`: { ghosts, nodes, edges, top (ids drawn over the rest), layout, iconUv(url) → [u0, v0,
   * u1, v1] | null }. Leaving nodes draw underneath, top ones last; emphasised edges over the others.
   */
  rebuild({
    ghosts,
    nodes,
    edges,
    top,
    layout,
    iconUv,
  }: {
    edges: any;
    ghosts: any;
    iconUv: any;
    layout: any;
    nodes: any;
    top: any;
  }): void;
  /**
   * Rewrite just `records` (nodes and edges whose springs moved this frame) and the edges of those nodes, in place.
   * Records that are no longer drawn are skipped. Returns false when the change needs a rebuild instead (anything
   * already written is then rewritten by it).
   */
  update(
    records: any,
    {
      top,
      layout,
      iconUv,
    }: {
      iconUv: any;
      layout: any;
      top: any;
    },
  ): boolean;
}
