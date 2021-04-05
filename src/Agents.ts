import { ctx } from './index.js';
import { SceneObject } from './Scene.js';
import { Vec2, addVectors, subractVectors, multiplyVectors } from './VectorMath.js';

/**
 * Represents the properties needed to represent the current state of an agent.
 */
export type AgentState = {
  id: string,
  position: Vec2,
  velocity: Vec2,
  acceleration: Vec2,
  orientation: number,
  cooldown: number
}

/**
 * Represents an agent, either AI controlled or player controlled.
 */
export class Agent implements SceneObject {
  // ------- Where I am currently -------
  private orientation = 0; // In radians
  private position: Vec2;
  private velocity: Vec2; // Measured in units/sec
  private acceleration: Vec2; // Measured in units/sec
  private cooldown: number;
  // ------- Where I am interpolating toward (sent from server) -------
  private destinationPosition: Vec2;
  private destinationVelocity: Vec2;
  private destinationAcceleration: Vec2;
  private destinationOrientation: number;
  private destinationCooldown: number;

  /**
   * Sets all properties to the given state and sets the destination to the current
   * properties (i.e. this.destinationVelocity = this.velocity)
   */
  constructor(state: AgentState) {
    this.position = state.position;
    this.velocity = state.velocity;
    this.acceleration = state.acceleration;
    this.orientation = state.orientation;
    this.cooldown = state.cooldown;

    // Destination props are the same as current props initially
    this.destinationPosition = this.position;
    this.destinationVelocity = this.velocity;
    this.destinationAcceleration = this.acceleration;
    this.destinationOrientation = this.orientation;
    this.destinationCooldown = this.cooldown;
  }

  /**
   * Draw sprite on the canvas, where its center is at this.position. Currently the sprite is a
   * simple black rectangle.
   */
  drawSprite = (location: Vec2): void => {
    let width = 100;
    let height = 50;
    // Where we want our rect to be drawn
    let centeredPos = {
      x: location.x - width / 2,
      y: location.y - height / 2
    }

    this.rotateThenDraw(
      location,
      this.orientation,
      centeredPos,
      (pos: Vec2) => {
        ctx.fillStyle = "black";
        ctx.fillRect(pos.x, pos.y, width, height);
      }
    );
  }

  /**
   * Returns the world position of this Agent (as opposed to screen coordinates)
   */
  getPosition = (): Vec2 => this.position;

  // TODO: Discuss whether below is a good design decision. Will probably lead to some weird quirks
  // with movement not feeling responsive.
  // TODO: figure out what the cooldown property is and how to update it
  /**
   * First, interpolates properties toward destination properties defined in last server update.
   * Then changes properties in response to a change in time, such as adding velocity to position.
   * 
   * Note that this current implementation only internpolates the velocity and acceleration. The
   * next time the server gives us an update, we'll snap to the destination position, but until
   * then, we'll trust that our velocity and acceleration should get us there (generally).
   * 
   * @param deltaTime the amount of time, in seconds, that has changed since the last update
   */
  update = (deltaTime: number): void => {
    console.log(this.velocity, this.acceleration)
    // // Find the difference between our velocity and acceleration vectors
    // let velocityDiff = subractVectors(this.destinationVelocity, this.velocity);
    // let accelerationDiff = subractVectors(this.destinationAcceleration, this.acceleration);
    // let orientationDiff = this.destinationOrientation - this.orientation;
    
    // // percentage to reduce the difference by on both axes
    // let reduceAmt = 0.1;
    // let reduceVec = { x: reduceAmt, y: reduceAmt };
    // this.velocity = addVectors(this.velocity, multiplyVectors(reduceVec, velocityDiff));
    // this.acceleration = addVectors(this.acceleration, multiplyVectors(reduceVec, accelerationDiff));
    // this.orientation += orientationDiff * reduceAmt;

    // Change our position according to our updated velocity and acceleration. Multiplying by
    // deltaTime makes sure we don't increase by the full velocity/acceleration every call to update
    this.position = addVectors(
      this.position,
      multiplyVectors(this.velocity, { x: deltaTime, y: deltaTime })
    );

    this.velocity = addVectors(
      this.velocity,
      multiplyVectors(this.acceleration, { x: deltaTime, y: deltaTime })
    );
  }

  /**
   * Given a server update AgentState, jump to the previous destination and make the new destination
   * state the given newState.
   * @param newState the state to interpolate toward
   */
  getServerUpdate = (newState: AgentState): void => {
    // Set all current attributes to the destination attributes
    this.position = this.destinationPosition;
    this.velocity = this.destinationVelocity;
    this.acceleration = this.destinationAcceleration;
    this.orientation = this.destinationOrientation;
    this.cooldown = this.destinationCooldown;

    // Set the destination to the new state
    this.destinationPosition = newState.position;
    this.destinationVelocity = newState.velocity;
    this.destinationAcceleration = newState.acceleration;
    this.destinationOrientation = newState.orientation;
    this.destinationCooldown = newState.cooldown;
  }
  
  // Rotates canvas, runs the given draw function, then resets angle of canvas
  private rotateThenDraw = (pos: Vec2, radians: number, centeredPos: Vec2, draw: (pos: Vec2) => void): void => {
    // rotate() rotates the entire drawing context, and rotates about the origin. To fix this, we
    // first translate to the center of our object to draw, then rotate, then draw, then reset our
    // translation
    ctx.translate(centeredPos.x, centeredPos.y);
    ctx.rotate(radians);

    // Draw at a corrected position. The origin is now centered where we want our centered rectangle
    // to be, so we need to draw at the centered location with our current position subtracted out.
    draw(subractVectors(centeredPos, pos));

    ctx.rotate(-radians);
    ctx.translate(-centeredPos.x, -centeredPos.y);
  }
}