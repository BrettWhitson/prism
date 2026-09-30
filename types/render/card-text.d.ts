export type TextRun =
  | string
  | {
      text: string;
      color?: string;
    }
  | {
      mark: string;
    }
  | {
      dot: string;
    };
export type RichText = string | TextRun[];
export type CardText = {
  width: number;
  height: number;
  title: string;
  subtitle?: RichText;
  value?: RichText;
  tag?: string;
  titleSize: number;
  subtitleSize: number;
  valueSize: number;
  textLeft: number;
  padding: number;
  text: string;
  muted: string;
  valueColor?: string | null;
  tagColor?: string | null;
  tagBackground: string;
};
/**
 * The text inside a card node (the renderer draws the box, stripe, icon and ports on the GPU): a title, a subtitle
 * and a value on their own lines, and a tag pill sitting on the top edge, top right. The subtitle and value are a
 * string or a list of runs:
 *
 *   "plain text"
 *   ["×12 ", { mark: "#c678dd" }, " Mystic Forge"]                  a small square
 *   ["21", { dot: "#e2b54f" }, " 60", { dot: "#b9bec7", }]           a small circle
 *   [{ text: "bound", color: "#8a93a6" }]                           coloured text
 *
 * Pure layout (cardTextLayout) plus drawing into any 2D context (drawCardText), so the renderer can cache the result
 * as a bitmap.
 */
/**
 * @typedef {string | { text: string, color?: string } | { mark: string } | { dot: string }} TextRun
 * @typedef {string | TextRun[]} RichText
 * @typedef {{ width: number, height: number, title: string, subtitle?: RichText, value?: RichText, tag?: string,
 *             titleSize: number, subtitleSize: number, valueSize: number, textLeft: number, padding: number,
 *             text: string, muted: string, valueColor?: string | null, tagColor?: string | null,
 *             tagBackground: string }} CardText
 */
/** Room above the card the bitmap keeps for the tag pill (it sits across the top edge). */
export declare const CARD_TAG_ROOM = 12;
/** Runs from a string or a list (anything else: none). Empty strings are dropped. */
export declare function toRuns(rich: any): any[];
/** Is `rich` a string or a list of well-formed runs? (for validation) */
export declare function isRichText(rich: any): boolean;
/**
 * Where each line goes (card units, from the card's top-left): the lines present, stacked and centred vertically.
 * @param {CardText} card
 * @returns {{ kind: "title" | "subtitle" | "value", y: number, size: number }[]}
 */
export declare function cardTextLayout(card: CardText): {
  kind: "title" | "subtitle" | "value";
  y: number;
  size: number;
}[];
/**
 * Draw the card's text into `context` (already scaled so one unit is one card unit), offset down by CARD_TAG_ROOM.
 * @param {CanvasRenderingContext2D} context
 * @param {CardText} card
 * @param {{ detail?: boolean }} [options]  detail false: the title only
 */
export declare function drawCardText(
  context: CanvasRenderingContext2D,
  card: CardText,
  {
    detail,
  }?: {
    detail?: boolean;
  },
): void;
/** `text` cut to fit `width` (measured with the context's current font), ending in "…" when cut. */
export declare function ellipsize(context: any, text: any, width: any): any;
