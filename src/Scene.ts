import { Background } from './GridBackground.js';
import { canvas, ctx } from './index.js';
import { addVectors, multiplyVectors, origin, randInt, subractVectors, Vec2 } from './VectorMath.js';

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
  // The position on the path that this camera is currently on. This is *not necessarily* the
  // position that the camera is centered on because this position can be augmented via a call to
  // shake() or some other augmentation of the position. See the augmentedPosition proprty.
  protected pathPosition: Vec2;
  // The radius for both the x and y axis. This will determine what the camera can see. We can zoom
  // in or zoom out by multiplying these by some constant.
  private axesRadii: Vec2;
  // This default will be changed when centerOn method is called
  private destinationPosition: () => Vec2;;
  private scene: Array<SceneObject>;
  private background: Background;
  private FOLLOW_DISTANCE = 50;
  // Percentage of gap between curr position & dest position to close each update. See this.update
  private lerpFactor = 0.1;
  // A scale of 1 means pixels match perfectly to their on-screen size. A scale of 2 means doubling
  // the on-screen size of objects, and a scale of 0.5 means halving the size.
  protected scale: number;
  // The amount of time the camera has been shaking for. Initializes to 0 and resets after a shake.
  private shakeTimeElapsed: number;
  protected isShaking: boolean;
  // This is the position that the camera is centered at. It is at some position relative to
  // pathPosition. For instance, a call to shake() offsets the position of this camera relative to
  // path position by using a formula similar to `f(x) = sin(50x) / x` where x represents time since
  // the shake started.
  protected augmentedPosition: Vec2;

  /**
   * Constructs a new Camera, given information about what to follow
   * @param positionToCenter A function that returns a position where this Camera should center on.
   * For instance, you might want a Camera to focus on the (x,y) coords of an Agent. Or, you might
   * want a free Camera that moves around with your arrow keys.
   */
  constructor(positionToCenter: () => Vec2, scene: Array<SceneObject>, background: Background, 
    scale: number = 1) {
    this.destinationPosition = positionToCenter;
    this.pathPosition = this.destinationPosition();
    this.augmentedPosition = this.pathPosition;
    this.scene = scene;
    this.background = background;
    this.scale = scale;
    this.axesRadii = {x: this.scale * (canvas.width / 2), y: this.scale * (canvas.height / 2)};
    this.shakeTimeElapsed = 0;
    this.isShaking = false;
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
   * Smoothly interpolate toward destination until camera is FOLLOW_DISTANCE from destination, then 
   * clamp to FOLLOW_DISTANCE away from destination.
   */
  update(deltaTime: number): void {
    let destPos = this.destinationPosition();
    let diff = subractVectors(destPos, this.pathPosition);

    // Only update position if the difference between current and destination is greater than 1
    if (Math.abs(diff.x) > 1 || Math.abs(diff.y) > 1) {
      let newPos = { x: 0, y: 0 };

      if (diff.x <= this.FOLLOW_DISTANCE) {
        newPos.x = this.pathPosition.x + diff.x * this.lerpFactor
      } else {
        newPos.x = destPos.x - Math.sign(diff.x) * this.FOLLOW_DISTANCE;
      }

      if (diff.y <= this.FOLLOW_DISTANCE) {
        newPos.y = this.pathPosition.y + diff.y * this.lerpFactor
      } else {
        newPos.y = destPos.y - Math.sign(diff.y) * this.FOLLOW_DISTANCE;
      }

      this.pathPosition = newPos;
    }

    if (this.isShaking) {
      this.shake(deltaTime);
    } else {
      this.augmentedPosition = this.pathPosition;
    }
  }

  /**
   * Shakes the camera. Used for effects like getting hit with a bullet.
   */
  shake = (deltaTime: number): void => {
    if (!this.isShaking) {
      this.isShaking = true;
    }
    
    // Only shake for 500ms
    if (this.shakeTimeElapsed <= 0.5) {
      // let periodLength = (this.shakeTimeElapsed / Math.PI)
      let toAdd = this.shakeTimeElapsed == 0 
        ? 0 
        : Math.sin(50 * this.shakeTimeElapsed) / this.shakeTimeElapsed;
      this.augmentedPosition = addVectors(this.pathPosition, { x: 0, y: toAdd });
      this.shakeTimeElapsed += deltaTime;
    } else {
      this.shakeTimeElapsed = 0;
      this.isShaking = false;
      this.augmentedPosition = this.pathPosition;
    }
  }

  /**
   * Renders all `SceneObject`s that this `Camera` is keeping track of in `this.scene`.
   * The current approach is to linearly check if each object should be on the screen. However, a
   * future implemention of scene may allow us to simply get all coordinates in an area.
   */
  renderAll = (): void => {
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

  // Converts the given world coordinates to screen coordinates. This factors in both scaling and
  // the center position of the screen that this camera can see.
  private worldToScreenCoords(coord: Vec2): Vec2 {
    return {
      x: canvas.width / 2 + this.scale * (coord.x - this.augmentedPosition.x),
      y: canvas.height / 2 + this.scale * (coord.y - this.augmentedPosition.y),
    }
  }

  // Returns the top left and bottom right coordinates that this camera can see in World
  // Coordinates.
  private computeWorldBounds = (): { topLeft: Vec2, bottomRight: Vec2 } => {
    // Compute bounds
    let topLeft = {
      x: this.augmentedPosition.x - this.axesRadii.x / this.scale,
      y: this.augmentedPosition.y - this.axesRadii.y / this.scale
    };
    let bottomRight = {
      x: this.augmentedPosition.x + this.axesRadii.x / this.scale,
      y: this.augmentedPosition.y + this.axesRadii.y / this.scale
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

/**
 * Same as normal camera, except follows arrow key controls instead of focusing on a player.
 * DebugCamera has the ability to toggle debug capabilities on or off (if off, is a normal Camera).
 */
export class DebugCamera extends Camera {
  // Holds values from an event.key from a vanilla keyboard event listener
  private keysDown: Array<string>;
  // Whether debug mode is on or not
  private debugOn: boolean;
  // Individual lines of text (separated by a new line) to show in the debug menu
  private debugLines: Array<() => string>;

  constructor(scene: Array<SceneObject>, background: Background, scale: number = 1) {
    super(() => origin, scene, background, scale);
    this.debugOn = true;
    this.keysDown = [];
    this.debugLines = [];
    this.debugLines.push(() => `Camera Mode: ${ this.debugOn ? 'Debug Camera' : 'Player Camera' }`);

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keysDown.push(e.key);

      // Toggle Camera type on space
      if (e.key == ' ') {
        this.toggleDebugFeatures();
      }

      // Simulate shaek
      if (e.key == 's') {
        this.shake(0);
      }
    });

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keysDown = this.keysDown.filter((key: string) => key != e.key);
    });

    // On scroll, update zoom
    document.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.scale += e.deltaY * -0.01;

      // Restrict scale from [.125, 3]
      this.scale = Math.min(Math.max(.125, this.scale), 3);
    }, { passive: false });
  }

  update = (deltaTime: number): void => {
    // Show and allow debug features if debug mode is on. Otherwise, act like a normal Camera.
    if (this.debugOn) {
      let vel = 50;

      // Update position from keyboard inputs
      if (this.keysDown.includes('ArrowUp')) {
        this.augmentedPosition = addVectors({ x: 0, y: -vel }, this.augmentedPosition);
      } else if (this.keysDown.includes('ArrowDown')) {
        this.augmentedPosition = addVectors({ x: 0, y: vel }, this.augmentedPosition);
      }

      if (this.keysDown.includes('ArrowRight')) {
        this.augmentedPosition = addVectors({ x: vel, y: 0 }, this.augmentedPosition);
      } else if (this.keysDown.includes('ArrowLeft')) {
        this.augmentedPosition = addVectors({ x: -vel, y: 0 }, this.augmentedPosition);
      }

      if (this.isShaking) this.shake(deltaTime);
    } else {
      super.update(deltaTime);
    }
  }

  /**
   * Adds a line of text to the debug menu
   * @param line a function that returns a line of text to add to the debug menu
   */
  addToDebugMenu(line: () => string): void {
    this.debugLines.push(line);
  }

  /**
   * Displays the debug menu in the top left corner of the screen
   */
  displayDebugMenu(): void {
    ctx.font = "15px Arial";
    let currLineYPos = 30;
    for (let grabDebugMessage of this.debugLines) {
      ctx.fillText(grabDebugMessage(), 30, currLineYPos);
      currLineYPos += 30;
    }
  }

  // Toggles debug menu and debug capabilities (like arrow key movement and mousewheel zooming)
  private toggleDebugFeatures = (): void => {
    this.debugOn = !this.debugOn;
  }
}