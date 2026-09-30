/**
 * Node label geometry, shared by the engine (which draws labels) and the layout (which leaves room for them), so
 * both agree on how big a label is and where it sits. Pure apart from the `measure(text) → width` function passed in.
 */
export declare const LABEL_FONT_FAMILY = '"Segoe UI", system-ui, sans-serif';
export declare const LABEL_PAD_X = 4;
export declare const LABEL_PAD_Y = 2;
/** Space between a node's border and its label. */
export declare const LABEL_GAP = 5;
export declare function labelFont(fontSize: any, bold?: boolean): string;
export declare function labelLineHeight(fontSize: any): number;
/** Label bitmaps are drawn at 2× for sharpness, but never bigger than this on either side (canvas limits). */
export declare const MAX_LABEL_BITMAP = 4096;
/**
 * Break a label into lines no wider than `maxWidth` (by `measure`), keeping its own line breaks. A word wider than a
 * whole line is broken wherever it has to be. "ellipsis" keeps each line to one row, cut with "…". Cuts fall between
 * characters (code points), never inside one.
 */
export declare function wrapLabel(
  text: any,
  maxWidth: any,
  overflow: any,
  measure: any,
): any[];
/** How much bigger than its CSS size to draw a `width` × `height` label bitmap: `preferred`, unless that's too big. */
export declare function labelBitmapScale(
  width: any,
  height: any,
  preferred?: number,
  maxSide?: number,
): number;
/**
 * A label's lines and its box (backdrop included) at zoom 1. `measure` must use `labelFont(fontSize, bold)`.
 * @returns {{ lines: string[], width: number, height: number, lineHeight: number }}
 */
export declare function layoutLabel(
  text: any,
  {
    fontSize,
    wrapWidth,
    overflow,
  }: {
    fontSize: any;
    overflow?: string;
    wrapWidth?: number;
  },
  measure: any,
): {
  lines: string[];
  width: number;
  height: number;
  lineHeight: number;
};
/**
 * Where a `width` × `height` label sits for a node of half-size `hw` × `hh`, relative to the node's centre.
 * @returns {{ x1: number, y1: number, x2: number, y2: number }}
 */
export declare function labelBox(
  position: any,
  hw: any,
  hh: any,
  width: any,
  height: any,
  gap?: number,
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
