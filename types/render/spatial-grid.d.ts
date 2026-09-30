export declare class SpatialGrid {
  #private;
  cellSize: number;
  /** @type {Map<string, number[]>} */
  cells: Map<string, number[]>;
  /** @type {{ x1: number, y1: number, x2: number, y2: number }[]} */
  boxes: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }[];
  /** Indexes of boxes too big (or too far out) to file in cells. */
  wide: Set<any>;
  /** @param {number} cellSize  world units per cell (a few node widths works well) */
  constructor(cellSize: number);
  /** File box number `index` (the caller's index into its own item list). */
  insert(index: any, box: any): void;
  /**
   * Move box number `index` to `box` in place (a few nodes moved: cheaper than rebuilding the grid). Cells stay in
   * index order, so hit() still finds the topmost of overlapping boxes.
   */
  move(index: any, box: any): void;
  /** Indexes of the boxes overlapping `area`, each once. */
  query(area: any): Set<any>;
  /** The topmost (last inserted) box containing the point, or -1. `accept(index)` can pass over some boxes. */
  hit(x: any, y: any, accept?: any): number;
}
export declare const overlaps: (a: any, b: any) => boolean;
