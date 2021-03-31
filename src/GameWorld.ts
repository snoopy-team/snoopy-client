import { canvas, ctx, constants } from './index.js';
import { Agent, AgentState } from './Agents.js';
import { Bullet } from './Bullet.js';
import { Server, ServerMock, ServerUpdate, ServerUpdateManager } from './ServerUtils.js';

/**
 * Holds the main game loop for this dogfighting game. Holds the state and behavior necessary to
 * continuously run a game.
 */
export class GameWorld {
  // Maps from IDs to Agents and same for Bullets
  private players: { [id: string]: Agent; };
  private bullets: { [id: string]: Bullet };
  private serverUpdateManager: ServerUpdateManager;

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
  }

  /**
   * This will loop at the speed of constants.FPS, moving and animating all players and bullets on
   * the screen.
   */
  gameLoop = (): void => {
    this.serverUpdateManager.beginRequestingUpdates();

    const millisPerFrame = 1000 / constants.FPS;
    setInterval(() => { 
      // Clear screen before next draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render background
      ctx.fillStyle = constants.BACKGROUND_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // apply all updates, if any, to the players and bullets
      if (this.serverUpdateManager.hasUpdate()) {
        // Get most recent update
        let serverUpdate: ServerUpdate = this.serverUpdateManager.getUpdate();

        // Update players
        for (let state of serverUpdate.players) {
          // Check if player is new
          let playerIsNew = !this.players.hasOwnProperty(state.id);
          if (playerIsNew) {
            this.players[state.id] = new Agent(state)
          }

          this.players[state.id].getServerUpdate(state);
        }

        // Update bullets
        for (let state of serverUpdate.bullets) {
          // Check if bullet is new
          let bulletIsNew = !this.bullets.hasOwnProperty(state.id);
          if (bulletIsNew) {
            this.bullets[state.id] = new Bullet(state.position, state.velocity);
          }

          this.bullets[state.id].getServerUpdate(state);
        }
      }

      // Update players
      for (let playerID of Object.keys(this.players)) {
        let secPerFrame = millisPerFrame / 1000;
        let player = this.players[playerID];
        player.update(secPerFrame);
        player.drawSprite()
      }

      // Update bullets
      for (let bulletID of Object.keys(this.bullets)) {
        let secPerFrame = millisPerFrame / 1000;
        let bullet = this.bullets[bulletID];
        bullet.update(secPerFrame);
        bullet.drawSprite()
      }

      // Add debug info to the top left
      if (constants.DEBUG_MODE) {
        let index = 0;
        for (let key of Object.keys(this.players)) {
          let player = this.players[key];
          ctx.font = "15px Arial";
          let pos = `(${player.getPosition().x}, ${player.getPosition().y})`
          ctx.fillText(`Player ID: "${key}", Position: ${pos}`, 30, 30);
          index++;
        }
      }
    }, millisPerFrame);
  }

  /**
   * Registers a new player given an Agent to represent the player and an ID for the player
   * @param player a new player in the game. Can be any type of player (i.e. AI, manual, etc.)
   * @param id the id that we will associate the player with when we receive updates from the server
   */
  addPlayer = (player: Agent, id: string): void => {
    this.players[id] = player;
  }

  /**
   * Registers a new bullet, given an Agent and and a string ID to associate this new player with.
   * @param bullet the bullet object
   * @param id an ID to associate the bullet with 
   */
  addBullet = (bullet: Bullet, id: string): void => {
    this.bullets[id] = bullet;
  }
}