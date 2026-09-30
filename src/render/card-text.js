import { LABEL_FONT_FAMILY } from "./labels.js";

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
export const CARD_TAG_ROOM = 12;

/** Runs from a string or a list (anything else: none). Empty strings are dropped. */
export function toRuns(rich) {
  if (typeof rich === "string") return rich ? [rich] : [];
  if (!Array.isArray(rich)) return [];
  return rich.filter(
    (run) =>
      (typeof run === "string" && run) ||
      (run &&
        typeof run === "object" &&
        ("text" in run || "mark" in run || "dot" in run)),
  );
}

/** Is `rich` a string or a list of well-formed runs? (for validation) */
export function isRichText(rich) {
  if (typeof rich === "string") return true;
  if (!Array.isArray(rich)) return false;
  return rich.every(
    (run) =>
      typeof run === "string" ||
      (run &&
        typeof run === "object" &&
        ((typeof run.text === "string" &&
          (run.color == null || typeof run.color === "string")) ||
          typeof run.mark === "string" ||
          typeof run.dot === "string")),
  );
}

const font = (size, weight) => `${weight} ${size}px ${LABEL_FONT_FAMILY}`;

/**
 * Where each line goes (card units, from the card's top-left): the lines present, stacked and centred vertically.
 * @param {CardText} card
 * @returns {{ kind: "title" | "subtitle" | "value", y: number, size: number }[]}
 */
export function cardTextLayout(card) {
  /** @type {{ kind: "title" | "subtitle" | "value", size: number }[]} */
  const lines = [{ kind: "title", size: card.titleSize }];
  if (toRuns(card.subtitle).length)
    lines.push({ kind: "subtitle", size: card.subtitleSize });
  if (toRuns(card.value).length)
    lines.push({ kind: "value", size: card.valueSize });
  const heights = lines.map((line) => line.size * 1.32);
  let y = (card.height - heights.reduce((a, b) => a + b, 0)) / 2;
  return lines.map((line, i) => {
    const centre = y + heights[i] / 2;
    y += heights[i];
    return { ...line, y: centre };
  });
}

/**
 * Draw the card's text into `context` (already scaled so one unit is one card unit), offset down by CARD_TAG_ROOM.
 * @param {CanvasRenderingContext2D} context
 * @param {CardText} card
 * @param {{ detail?: boolean }} [options]  detail false: the title only
 */
export function drawCardText(context, card, { detail = true } = {}) {
  const top = CARD_TAG_ROOM;
  const left = card.textLeft,
    right = card.width - card.padding;
  context.textBaseline = "middle";
  for (const line of cardTextLayout(card)) {
    const y = top + line.y;
    if (line.kind === "title") {
      context.font = font(line.size, 600);
      context.fillStyle = card.text;
      context.fillText(ellipsize(context, card.title, right - left), left, y);
      continue;
    }
    if (!detail) continue;
    context.font = font(line.size, line.kind === "value" ? 600 : 400);
    const base =
      line.kind === "value" ? (card.valueColor ?? card.text) : card.muted;
    drawRuns(context, toRuns(card[line.kind]), left, right, y, line.size, base);
  }
  if (detail && card.tag) drawTag(context, card, top);
}

/** Runs along one line, cut off (with an ellipsis) at `right`. */
function drawRuns(context, runs, left, right, y, size, color) {
  let x = left;
  const markSize = Math.max(3, size * 0.55);
  for (const run of runs) {
    if (x >= right) break;
    if (typeof run === "string" || "text" in run) {
      const text = typeof run === "string" ? run : run.text;
      context.fillStyle =
        typeof run === "string" ? color : (run.color ?? color);
      const fitted = ellipsize(context, text, right - x);
      context.fillText(fitted, x, y);
      x += context.measureText(fitted).width;
      if (fitted !== text) break;
      continue;
    }
    if (x + markSize > right) break;
    context.fillStyle = "mark" in run ? run.mark : run.dot;
    context.beginPath();
    if ("mark" in run)
      context.rect(x + 1, y - markSize / 2, markSize, markSize);
    else context.arc(x + 1 + markSize / 2, y, markSize / 2, 0, Math.PI * 2);
    context.fill();
    x += markSize + 3;
  }
}

/** A pill across the top edge, top right: its text in the tag colour, a faint border and background. */
function drawTag(context, card, top) {
  const size = 10;
  context.font = font(size, 600);
  const color = card.tagColor ?? card.text;
  const width = context.measureText(card.tag).width + 12;
  const height = size + 7;
  const x = card.width - card.padding - width,
    y = top - height / 2;
  context.beginPath();
  context.roundRect(x, y, width, height, height / 2);
  context.fillStyle = card.tagBackground;
  context.fill();
  context.globalAlpha *= 0.45;
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.stroke();
  context.globalAlpha /= 0.45;
  context.fillStyle = color;
  context.fillText(card.tag, x + 6, y + height / 2 + 0.5);
}

/** `text` cut to fit `width` (measured with the context's current font), ending in "…" when cut. */
export function ellipsize(context, text, width) {
  if (width <= 0) return "";
  if (context.measureText(text).width <= width) return text;
  const chars = [...text];
  let low = 0,
    high = chars.length;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (
      context.measureText(`${chars.slice(0, middle).join("")}…`).width <= width
    )
      low = middle;
    else high = middle - 1;
  }
  return low ? `${chars.slice(0, low).join("")}…` : "";
}
