import { canvas } from './index.js';
import { Vec2 } from './VectorMath.js';

// TODO
export type SceneObject = {
  // TODO
  getPosition: () => Vec2;
  // TODO
  drawSprite(x: number, y: number): void;
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
 class Camera {
  // The position this camera is looking at
  private position: Vec2;
  // The radius for both the x and y axis. This will determine what the camera can see. We can zoom
  // in or zoom out by multiplying these by some constant.
  private axesRadii: Vec2;
  // This default will be changed when centerOn method is called
  private destinationPosition: () => Vec2 = () => this.position;
  private scene: Array<SceneObject>;

  /**
   * Constructs a new Camera, given information about what to follow
   * @param positionToCenter A function that returns a position where this Camera should center on.
   * For instance, you might want a Camera to focus on the (x,y) coords of an Agent. Or, you might
   * want a free Camera that moves around with your arrow keys.
   */
  constructor(positionToCenter: () => Vec2, 
    scene: Array<SceneObject>, ctx: CanvasRenderingContext2D) {
    this.destinationPosition = positionToCenter;
    this.position = this.destinationPosition();
    this.scene = scene;

    // TODO: should this be left arbitrarily defined?
    this.axesRadii = {x: canvas.width / 2, y: canvas.height / 2};
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
  update = () => {
    this.position = this.destinationPosition();
  }

  // TODO
  // The current approach is to linearly check if each object should be on the screen. However, a
  // future implemention of scene may allow us to simply get all coordinates in an area.
  renderAll = () => {
    for (let object of this.scene) {
      let objPos = object.getPosition();
      if (this.coordWithinBounds(objPos)) {
        let objectScreenCoords = this.worldToScreenCoords(objPos);
        object.drawSprite(objectScreenCoords.x, objectScreenCoords.y);
      }
    }
  }

  // TODO
  private worldToScreenCoords(coord: Vec2): Vec2 {
    // Compute bounds
    let topLeft = this.computeWorldBounds().topLeft;

    // Get the world distance between the top camera boundary and y=0
    let yDistToZero = topLeft.y;
    // Get the world distance between the left camera boundary and x=0
    let xDistToZero = topLeft.x;

    return {
      x: coord.x - xDistToZero,
      y: coord.y - yDistToZero
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