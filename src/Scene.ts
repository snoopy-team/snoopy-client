import { Background } from './GridBackground.js';
import { canvas, ctx } from './index.js';
import { addVectors, multiplyVectors, origin, subractVectors, Vec2 } from './VectorMath.js';

// Represents an object that can be viewed with a Camera. It must include methods that provide
// enough information for the Camera to scale it, transform its position into a screen coordinate,
// and must be able to draw itself at a certain location.
export type SceneObject = {
  // Returns the world position of this SceneObject (as opposed to screen coordinates)
  getPosition: () => Vec2;
  // Draws the sprite given a screen coordinate (where (0,0) is the top left corner of the screen)
  // and the dimensions (width, height) of the on-screen object
  drawSprite(pos: Vec2, size: Vec2): void;
  // Returns the pixel dimensions of this SceneObject. The Camera can decide to scale this
  getSize: () => Vec2;
}

/**
 * Represents a Camera through which the player sees the world. A Camera will control where objects
 * are rendered on the screen or if they should be rendered at all. For instance, an object that is
 * at world position (500,500) may not be rendered if the camera is currently looking at 50x50 and
 * does not have enough space on the screen to show objects at (500,500). 
 * 
 * Potential functionality for a Camera which is not necessarily implemented is scaling (zooming in
 * or zooming out) of a game scene, following any player (AI or manually-controlled), following a
 * defined line of motion (i.e. for a cut scene), or even following a position controlled by arrow
 * keys (i.e. for a debug camera)
 */
 export class Camera {
  // The position this camera is looking at
  private position: Vec2;
  // The radius for both the x and y axis. This will determine what the camera can see. We can zoom
  // in or zoom out by multiplying these by some constant.
  private axesRadii: Vec2;
  // This default will be changed when centerOn method is called
  private destinationPosition: () => Vec2 = () => this.position;
  private scene: Array<SceneObject>;
  private background: Background;
  private FOLLOW_DISTANCE = 50;
  // Percentage of gap between curr position & dest position to close each update. See this.update
  private lerpFactor = 0.1;
  // A scale of 1 means pixels match perfectly to their on-screen size. A scale of 2 means doubling
  // the on-screen size of objects, and a scale of 0.5 means halving the size.
  private scale: number;

  /**
   * Constructs a new Camera, given information about what to follow
   * @param positionToCenter A function that returns a position where this Camera should center on.
   * For instance, you might want a Camera to focus on the (x,y) coords of an Agent. Or, you might
   * want a free Camera that moves around with your arrow keys.
   */
  constructor(positionToCenter: () => Vec2, scene: Array<SceneObject>, background: Background, 
    scale: number = 1) {
    this.destinationPosition = positionToCenter;
    this.position = this.destinationPosition();
    this.scene = scene;
    this.background = background;
    this.scale = scale;
    this.axesRadii = {x: this.scale * (canvas.width / 2), y: this.scale * (canvas.height / 2)};
  }

  /**
   * Updates the position to center on.
   * @param positionToCenter A function that returns a position where this Camera should center on.
   * For instance, you might want a Camera to focus on the (x,y) coords of an Agent. Or, you might
   * want a free Camera that moves around with your arrow keys.
   */
  centerOn = (positionToCenter: () => Vec2) => {
    this.destinationPosition = positionToCenter;
  }

  /**
   * Currently, update simply snaps to whatever the camera is following. However, soon I will
   * implement smooth camera following via lerping and other types of cameras such as a free control
   * camera.
   */
  /**
   * Smoothly interpolate toward destination until camera is FOLLOW_DISTANCE from destination, then 
   * clamp to FOLLOW_DISTANCE away from destination.
   */
  update = () => {
    let destPos = this.destinationPosition();
    let diff = subractVectors(destPos, this.position);
    let newPos = { x: 0, y: 0 };

    if (diff.x <= this.FOLLOW_DISTANCE) {
      newPos.x = this.position.x + diff.x * this.lerpFactor
    } else {
      newPos.x = destPos.x - Math.sign(diff.x) * this.FOLLOW_DISTANCE;
    }

    if (diff.y <= this.FOLLOW_DISTANCE) {
      newPos.y = this.position.y + diff.y * this.lerpFactor
    } else {
      newPos.y = destPos.y - Math.sign(diff.y) * this.FOLLOW_DISTANCE;
    }

    this.position = destPos;
  }

  // TODO
  // The current approach is to linearly check if each object should be on the screen. However, a
  // future implemention of scene may allow us to simply get all coordinates in an area.
  renderAll = () => {
    // Draw background
    let worldBounds = this.computeWorldBounds();
    let gridSquareSize = 100;
    let gridSquareVec = { x: this.scale * gridSquareSize, y: this.scale * gridSquareSize };
    this.background.draw(ctx, worldBounds.topLeft, worldBounds.bottomRight, gridSquareVec);
    
    // Draw all objects
    for (let object of this.scene) {
      let objPos = object.getPosition();
      let scaledSize = multiplyVectors({ x: this.scale, y: this.scale }, object.getSize());

      if (this.coordWithinBounds(objPos)) {
        let objectScreenCoords = this.worldToScreenCoords(objPos);
        object.drawSprite(objectScreenCoords, scaledSize);
      }
    }
  }

  // TODO HMMM somehow I have to scale these coordinates
  private worldToScreenCoords(coord: Vec2): Vec2 {
    return {
      x: canvas.width / 2 + this.scale * (coord.x - this.position.x),
      y: canvas.height / 2 + this.scale * (coord.y - this.position.y),
    }
  }

  // Returns the top left and bottom right coordinates that this camera can see in World
  // Coordinates.
  private computeWorldBounds = () => {
    // Compute bounds
    let topLeft = {
      x: this.position.x - this.axesRadii.x,
      y: this.position.y - this.axesRadii.y
    };
    let bottomRight = {
      x: this.position.x + this.axesRadii.x,
      y: this.position.y + this.axesRadii.y
    };

    return { topLeft, bottomRight }
  }

  // Determines if the given bounds are within the bounds of what the camera can "see" in World
  // Coordinates.
  private coordWithinBounds = (coord: Vec2): boolean => {
    // Compute bounds
    let topLeft = this.computeWorldBounds().topLeft;
    let bottomRight = this.computeWorldBounds().bottomRight;

    return coord.x >= topLeft.x && coord.y >= topLeft.y 
        && coord.x <= bottomRight.x && coord.y <= bottomRight.y;
  }
}