/**
 * DOM handles the WebGL loop writes to directly (no React state per frame):
 * the sticky stage element, the SVG leader line and the callout card nodes.
 */
export const overlay = {
  stageEl: null,
  linePath: null,
  lineDot: null,
  cards: {},
}
