import { Vec2 } from "./VectorMath.js";
import { ctx } from "./index.js";
import { SceneObject } from "./Scene.js";

/**
 * Holds the state information for a bullet but not behavior
 */
export type BulletState = {
  id: string,
  position: Vec2,
  velocity: Vec2
}

/**
 * Holds the state and behavior for a bullet, such as updating and drawing itself
 */
export class Bullet implements SceneObject {
  private position: Vec2;
  private velocity: Vec2;
  private radius: number;

  constructor(position: Vec2, velocity: Vec2) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 10;
  }

  /**
   * Returns this Bullets position
   */
  getPosition = (): Vec2 => {
    return this.position;
  };

  /**
   * Draws the sprite of this bullet. Note that the size parameter represents the radius on both the
   * x AND y axis.
   */
  drawSprite = (pos: Vec2, size: Vec2): void => {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size.x, 0, Math.PI * 2);
    ctx.fill()
  }

  /**
   * 
   */
  getSize = (): Vec2 => { 
    return { x: this.radius, y: this.radius } 
  };

  /**
   * Given an amount of time that has passed since the last frame, update the properties of this
   * bullet.
   * @param deltaTime the amount of time in seconds (typically a fraction of a second) that has 
   * passed since the last update
   */
  update = (deltaTime: number): void => {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  /**
   * Given a server update BulletState, set this bullet's properties to the new state provided
   * @param newState the state to interpolate toward
   */
  getServerUpdate = (newState: BulletState): void => {
    this.velocity = newState.velocity;
    this.position = newState.position;
  }
}