/**
 * The view onto the graph: a zoom and a pan, mapping world coordinates (where the layout put the nodes) to screen
 * pixels. screen = world × zoom + pan. Pure: no DOM.
 */
export declare class Camera {
  zoom: number;
  panX: number;
  panY: number;
  minZoom: number;
  maxZoom: number;
  /** @param {{ minZoom?: number, maxZoom?: number }} [limits] */
  constructor({ minZoom, maxZoom }?: { minZoom?: number; maxZoom?: number });
  toScreen(
    x: any,
    y: any,
  ): {
    x: number;
    y: number;
  };
  toWorld(
    x: any,
    y: any,
  ): {
    x: number;
    y: number;
  };
  /** Zoom by `factor`, keeping the world point under screen point (sx, sy) where it is. */
  zoomAround(factor: any, sx: any, sy: any): void;
  panBy(dx: any, dy: any): void;
  /**
   * Show the world box `bounds` centred in a `width` × `height` viewport with `padding` pixels around it, never zooming
   * in past `maxFitZoom` (so a single node isn't blown up to fill the screen).
   */
  fit(
    bounds: any,
    width: any,
    height: any,
    {
      padding,
      maxFitZoom,
    }?: {
      maxFitZoom?: number;
      padding?: number;
    },
  ): void;
  /** The world box currently on screen (for culling), with `margin` screen pixels to spare. */
  visibleWorld(
    width: any,
    height: any,
    margin?: number,
  ): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  /** Column-major 3×3 matrix mapping world coordinates to WebGL clip space for a `width` × `height` viewport. */
  clipMatrix(width: any, height: any): Float32Array<ArrayBuffer>;
}
