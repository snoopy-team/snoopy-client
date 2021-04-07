import { canvas, ctx, constants, imageSnoopy } from './index.js';
import { Agent, AgentState } from './Agents.js';
import { Bullet } from './Bullet.js';
import { Server, ServerMock, ServerUpdate, ServerUpdateManager } from './ServerUtils.js';
import { Camera, DebugCamera, SceneObject } from './Scene.js';
import { GridBackground } from './GridBackground.js';
import { origin, Vec2 } from './VectorMath.js';

/**
 * Holds the main game loop for this dogfighting game. Holds the state and behavior necessary to
 * continuously run a game.
 */
export class GameWorld {
  // Maps from IDs to Agents and same for Bullets
  private players: { [id: string]: Agent; };
  private bullets: { [id: string]: Bullet };
  private serverUpdateManager: ServerUpdateManager;
  private isRequestingUpdates: boolean;
  // Used in gameLoop to keep track of the time that our last loop was run
  private before: number;
  private millisPassedSinceLastFrame: number;
  // Provides our Camera with objects to draw
  private scene: Array<SceneObject>;
  private camera: Camera;
  private finishedCreatingDebugMenu: boolean;

  /**
   * Constructs a GameWorld from information that is available via a server update packet.
   * @param players the dogfighters to render
   * @param bullets the bullets to render
   * @param updateManager the manager for the server we're listening to that will provide us with
   * updates to our game objects
   */
  constructor(updateManager: ServerUpdateManager) {
    this.players = {};
    this.bullets = {};
    this.serverUpdateManager = updateManager;
    this.isRequestingUpdates = false;
    this.before = Date.now();
    this.millisPassedSinceLastFrame = 0;
    this.scene = [];
    this.camera = new Camera(() => origin, this.scene, new GridBackground());
    this.camera = new DebugCamera(this.scene, new GridBackground());
    this.finishedCreatingDebugMenu = false;
  }

  /**
   * This will loop at the speed of constants.FPS, moving and animating all players and bullets on
   * the screen.
   */
  gameLoop = (): void => {
    // Only request continual updates once, on the first call of the gameLoop
    if (!this.isRequestingUpdates) { 
      this.serverUpdateManager.beginRequestingUpdates();
      this.isRequestingUpdates = true;
    }

    let now = Date.now();
    this.millisPassedSinceLastFrame += now - this.before;
    const millisPerFrame = 1000 / constants.FPS;
    
    if (this.millisPassedSinceLastFrame >= millisPerFrame) {
      // Clear screen before next draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // apply all updates, if any, to the players and bullets
      if (this.serverUpdateManager.hasUpdate()) {
        // Get most recent update
        let serverUpdate: ServerUpdate = this.serverUpdateManager.getUpdate();

        // Update players
        for (let state of serverUpdate.players) {
          // Check if player is new
          let playerIsNew = !this.players.hasOwnProperty(state.id);
          if (playerIsNew) {
            let agent = new Agent(
              state, 
              (pos: Vec2, size: Vec2) => {
                // TODO: figure out how to determine which player to draw (Snoopy vs Red Barron)
                ctx.drawImage(imageSnoopy, pos.x, pos.y, size.x, size.y);
              },
              { x: 100, y: 150 } // Will need to change this for drawing Red Barron sprite
            );
            this.players[state.id] = agent;
            this.scene.push(agent);
            this.camera.centerOn(agent.getPosition)

            if (constants.DEBUG_MODE) {
              ctx.font = "15px Arial";
              (<DebugCamera> this.camera).addToDebugMenu(() => `Player ID: "${state.id}", Position: (${Math.round(agent.getPosition().x)}, ${Math.round(agent.getPosition().y)})`);
              (<DebugCamera> this.camera).addToDebugMenu(() => `Press "s" to simulate camera shake.`);
            }
          }

          this.players[state.id].getServerUpdate(state);
        }

        // Update bullets
        for (let state of serverUpdate.bullets) {
          // Check if bullet is new
          let bulletIsNew = !this.bullets.hasOwnProperty(state.id);
          if (bulletIsNew) {
            let bullet = new Bullet(state.position, state.velocity);
            this.bullets[state.id] = bullet;
            this.scene.push(bullet);
          }

          this.bullets[state.id].getServerUpdate(state);
        }
      }

      // Update players
      for (let playerID of Object.keys(this.players)) {
        let secPerFrame = millisPerFrame / 1000;
        let player = this.players[playerID];
        player.update(this.millisPassedSinceLastFrame / 1000);
      }
      
      // Update bullets
      for (let bulletID of Object.keys(this.bullets)) {
        let secPerFrame = millisPerFrame / 1000;
        let bullet = this.bullets[bulletID];
        bullet.update(this.millisPassedSinceLastFrame / 1000);
      }

      // Draw all game objects
      this.camera.update(this.millisPassedSinceLastFrame / 1000);
      this.camera.renderAll();

      // Add debug info to the top left
      if (constants.DEBUG_MODE) {
        (<DebugCamera> this.camera).displayDebugMenu();
      }

      this.millisPassedSinceLastFrame = 0;
    }

    this.before = now;
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Registers a new player given an Agent to represent the player and an ID for the player
   * @param player a new player in the game. Can be any type of player (i.e. AI, manual, etc.)
   * @param id the id that we will associate the player with when we receive updates from the server
   */
  addPlayer = (player: Agent, id: string): void => {
    this.players[id] = player;
    this.scene.push(player);
  }

  /**
   * Registers a new bullet, given an Agent and and a string ID to associate this new player with.
   * @param bullet the bullet object
   * @param id an ID to associate the bullet with 
   */
  addBullet = (bullet: Bullet, id: string): void => {
    this.bullets[id] = bullet;
    this.scene.push(bullet);
  }
}