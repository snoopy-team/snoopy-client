import { canvas } from "./index.js";
import { addVectors, modVectors, multiplyVectors, origin, subractVectors, Vec2 } from "./VectorMath.js";

export interface Background {
  /**
   * Given a point of origin and screen bounds (top left, bottom right), draws a grid background
   * where each grid square is the size given by `dimensions`
   * @param ctx our canvas drawing context
   * @param topLeft the absolute, world coordinate of the top left of our viewing area
   * @param bottomRight the absolute, world coordinate of the bottom right of our viewing area
   * @param scale the zoom of the world. A scale of 2 means 2x zoomed in.
   * @param worldToScreenCoords a function that gives you screen coords given world coords
   */
  draw(ctx: CanvasRenderingContext2D, topLeft: Vec2, bottomRight: Vec2, scale: number, worldToScreenCoords: (world: Vec2) => Vec2): void;
}

/**
 * Draws a line on the canvas from the points specified
 * @param from the starting point of the line
 * @param to the ending point of the line
 */
const drawLine = (ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2) => {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

/**
 * For drawing the borders of the world, which are the walls that Snoopy will not be able to go
 * past.
 */
export class WorldBorderBackground implements Background {
  private topLeft: Vec2;
  private bottomRight: Vec2;

  /**
   * Constructs a new WorldBorderbackground given a top left and bottom right of the world borders.
   * @param topLeft The top left of the boundary of the world in game units. Snoopy will start
   * out at the origin in absolute game units.
   * @param bottomRight The bottom right of the boundary of the world in game units.
   */
  constructor(topLeft: Vec2, bottomRight: Vec2) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
  }

  /**
   * Given a point of origin and screen bounds (top left, bottom right), draws a grid background
   * where each grid square is the size given by `dimensions`
   * @param ctx our canvas drawing context
   * @param topLeft the absolute, world coordinate of the top left of our viewing area
   * @param bottomRight the absolute, world coordinate of the bottom right of our viewing area
   */
  draw(ctx: CanvasRenderingContext2D, topLeft: Vec2, bottomRight: Vec2, scale: number, 
    worldToScreenCoords: (world: Vec2) => Vec2): void {
    // Define screen coords for lines
    let topLeftScreen = worldToScreenCoords(this.topLeft);
    let bottomRightScreen = worldToScreenCoords(this.bottomRight);
    let bottomLeftScreen = worldToScreenCoords({ x: this.topLeft.x, y: this.bottomRight.y });
    let topRightScreen = worldToScreenCoords({ x: this.bottomRight.x, y: this.topLeft.y });

    // Change the color of the border lines
    ctx.strokeStyle = 'red';
    let origLineWidth = ctx.lineWidth;
    ctx.lineWidth = 10;

    // Draw the borders: left, bottom, right, top
    drawLine(ctx, topLeftScreen, bottomLeftScreen);
    drawLine(ctx, bottomLeftScreen, bottomRightScreen);
    drawLine(ctx, bottomRightScreen, topRightScreen);
    drawLine(ctx, topRightScreen, topLeftScreen);

    // Reset strokeStyle to default
    ctx.strokeStyle = 'black';
    ctx.lineWidth = origLineWidth;
  }
}

/**
 * TODO
 */
export class WorldBorderWithGrid extends WorldBorderBackground {
  private gridBackground: Background;

  /**
   * Constructs a new WorldBorderWithGrid with the given boundaries of the world
   * @param topLeft The top left of the boundary of the world in game units. Snoopy will start
   * out at the origin in absolute game units.
   * @param bottomRight The bottom right of the boundary of the world in game units.
   */
  constructor(topLeft: Vec2, bottomRight: Vec2) {
    super(topLeft, bottomRight);
    this.gridBackground = new GridBackground();
  }

  draw(ctx: CanvasRenderingContext2D, topLeft: Vec2, bottomRight: Vec2, scale: number, 
    worldToScreenCoords: (world: Vec2) => Vec2): void {
    super.draw(ctx, topLeft, bottomRight, scale, worldToScreenCoords);
    this.gridBackground.draw(ctx, topLeft, bottomRight, scale, worldToScreenCoords);
  }
}

/**
 * For drawing grid lines as a background. This won't necessarily be used as our final background
 * for the project but it will serve the purpose to visually test our camera.
 */
export class GridBackground implements Background {
  private gridSquareDimensions: Vec2;

  constructor() {
    this.gridSquareDimensions = { x: 100, y: 100. };
  }

  /**
   * Given a point of origin and screen bounds (top left, bottom right), draws a grid background
   * where each grid square is the size given by `dimensions`
   * @param ctx our canvas drawing context
   * @param topLeft the absolute, world coordinate of the top left of our viewing area
   * @param bottomRight the absolute, world coordinate of the bottom right of our viewing area
   */
  draw = (ctx: CanvasRenderingContext2D, topLeft: Vec2, bottomRight: Vec2, scale: number, 
    worldToScreenCoords: (pos: Vec2) => Vec2) => {
    let dimensions = multiplyVectors(this.gridSquareDimensions, { x: scale, y: scale }); 

    // This is the (x,y) of the intersection of the top, leftmost horizintal and vertical lines
    // Should be above and to the left of the `topLeft` viewing bound.
    let gridOriginOffset = modVectors(topLeft, dimensions);

    // This gets the screen coordinates of our grid origin. I.e. might be negative if the top left
    // of our screen is viewing a coordinate past the origin like (50, 50)
    let gridOrigin = subractVectors(origin, gridOriginOffset);
    
    // Draw vertical lines
    for (let x = gridOrigin.x; x <= canvas.width; x += dimensions.x) {
      let start = { x: x, y: 0 };
      let end = { x: x, y: canvas.height };
      drawLine(ctx, start, end);
    }

    // Draw horizontal lines
    for (let y = gridOrigin.y; y <= canvas.height; y += dimensions.y) {
      let start = { x: 0, y: y };
      let end = { x: canvas.width, y: y };
      drawLine(ctx, start, end);
    }
  }

  // Draws the given text at the given coordinate with a circle behind it acting as a background.
  private textWithCircleBackground(ctx: CanvasRenderingContext2D, text: string, coord: Vec2, 
    radius: number) {
    // Store default so we can return to default after
    let defaultTextAlign = ctx.textAlign;

    ctx.arc(coord.x, coord.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(text, coord.x, coord.y);

    // Use stored default to return to normal
    ctx.textAlign = defaultTextAlign;
  }
}

// TODO: draw circles with text inside of them. The text is the coordinate of the center of the
// circle. We want to draw a circle at every multiple of dimension (i.e. (100, 100), (200, 200))
// within the viewing space. We can use the worldToScreen function to accurately get these
// positions, so it actually shouldn't be very difficult.