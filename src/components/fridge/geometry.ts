/**
 * Fridge geometry in a 280 x 440 design space. Everything is derived from the
 * reference render: a tall, softly rounded cabinet (door ~0.54 wide:tall), a
 * vertical handle at the left of the door, a small display at its upper right,
 * a narrow right side face in 3/4 perspective and two low feet.
 *
 * The camera sits slightly left of the fridge at about mid-height, so the right
 * side converges: its top edge slopes down and its bottom edge slopes up.
 */
export const VB_W = 280;
export const VB_H = 440;

export const BODY = { x: 18, y: 18, w: 214, h: 388, r: 30 };

/** The door sits 4 units inside the body so there is a visible seam all around. */
export const DOOR = { x: 22, y: 22, w: 206, h: 380, r: 26 };

/** Door hinge is the right edge (handle is on the left, side face is on the right). */
export const HINGE_X = DOOR.x + DOOR.w;

export const SIDE = {
  frontX: BODY.x + BODY.w,
  backX: BODY.x + BODY.w + 38,
};

export const CAVITY = { x: 30, y: 30, w: 190, h: 364, r: 16 };
export const BACK_WALL = { x: 58, y: 62, w: 134, h: 300 };

export const HANDLE = { x: 19, y: 68, w: 11, h: 134 };
export const DISPLAY = { x: 126, y: 60, w: 54, h: 102, r: 9 };

export const DOOR_THICKNESS = 15;

/** Door travel. Doors on mini fridges stop a little past perpendicular. */
export const DOOR_MAX_ANGLE = 100;
/** Past this angle the inside of the door faces the camera. */
export const DOOR_FLIP_ANGLE = 86;

/** Camera / vanishing point in design space (center of the visible fridge). */
export const CAMERA = { x: 150, y: 222 };
export const PERSPECTIVE = 2.6 * VB_W;
