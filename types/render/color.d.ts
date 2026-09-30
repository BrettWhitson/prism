/**
 * Any CSS colour → [r, g, b, a] in 0..1. "#rgb", "#rgba", "#rrggbb", "#rrggbbaa", rgb()/rgba() and "transparent" are
 * read directly; anything else (names, hsl()…) goes through a 2D canvas when there's a document. What can't be read
 * is grey.
 */
export declare function parseColorAlpha(color: any): any;
/** Any CSS colour → [r, g, b] in 0..1 (its alpha dropped; see parseColorAlpha). */
export declare function parseColor(color: any): any;
/** parseColor for colours looked up every frame. Don't modify the result. */
export declare function cachedColor(hex: any): any;
