/**
 * Window-space rectangles of elements that "travel" between screens (shared-element feel).
 * Screens publish their anchor after layout; transitions read it to grow/shrink from the
 * exact place the user touched or last saw the element.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const rects: { hero?: Rect } = {};

export const sharedRects = {
  setHero(r: Rect) {
    rects.hero = r;
  },
  hero(): Rect | undefined {
    return rects.hero;
  },
};
