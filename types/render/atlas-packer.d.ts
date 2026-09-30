/**
 * Shelf packing for texture atlases: rectangles are placed left to right in rows ("shelves"); a new shelf starts when a
 * row is full, and a new page when the atlas is. Good enough for icons (all the same size) and label images (one
 * height per font size). Pure: it only hands out positions.
 */
export declare class AtlasPacker {
  size: number;
  padding: number;
  page: number;
  x: number;
  y: number;
  shelfHeight: number;
  /** @param {number} size  atlas page width and height in pixels */
  constructor(size: number, padding?: number);
  /**
   * A spot for a `width` × `height` rectangle: `{ page, x, y }`, or null when it can never fit.
   * Positions are in pixels on that page.
   */
  place(
    width: any,
    height: any,
  ): {
    page: number;
    x: number;
    y: number;
  };
}
