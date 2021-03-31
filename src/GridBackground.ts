import { canvas } from "./index.js";
import { modVectors, origin, subractVectors, Vec2 } from "./VectorMath.js";

/**
 * For drawing grid lines as a background. This won't necessarily be used as our final background
 * for the project but it will serve the purpose to visually test our camera.
 */
export class GridBackground {
  /**
   * Given a point of origin and screen bounds (top left, bottom right), draws a grid background
   * where each grid square is the size given by `dimensions`
   * @param ctx our canvas drawing context
   * @param topLeft the absolute, world coordinate of the top left of our viewing area
   * @param bottomRight the absolute, world coordinate of the bottom right of our viewing area
   */
  draw = (ctx: CanvasRenderingContext2D, topLeft: Vec2, bottomRight: Vec2, 
    dimensions: Vec2) => {
      // This is the (x,y) of the intersection of the top, leftmost horizintal and vertical lines
      // Should be above and to the left of the `topLeft` viewing bound.
      let gridOriginOffset = modVectors(topLeft, dimensions);
      let gridOrigin = subractVectors(origin, gridOriginOffset);
      
      // Draw vertical lines
      for (let x = gridOrigin.x; x <= bottomRight.x; x += dimensions.x) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = gridOrigin.y; y <= bottomRight.y; y += dimensions.y) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
  }
}