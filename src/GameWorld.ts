import { canvas, ctx, constants, imageSnoopy, ioManager } from './index.js';
import { Agent, AgentState } from './Agents.js';
import { Bullet } from './Bullet.js';
import { Server, ServerMock, ServerUpdate, ServerUpdateManager } from './ServerUtils.js';
import { Camera, DebugCamera, SceneObject } from './Scene.js';
import { GridBackground, WorldBorderBackground, WorldBorderWithGrid } from './GridBackground.js';
import { origin, Vec2 } from './VectorMath.js';
import { doNothingKeyboardLayout, KeyboardLayout } from './KeyboardManager.js';

/**
 * Holds the main game loop for this dogfighting game. Holds the state and behavior necessary to
 * continuously run a game.
 */
export class GameWorld {
  // Maps from IDs to Agents and same for Bullets
  private players: { [id: string]: Agent; };
  private bullets: { [id: string]: Bullet[] };
  private serverUpdateManager: ServerUpdateManager;
  private isRequestingUpdates: boolean;
  // Used in gameLoop to keep track of the time that our last loop was run
  private before: number;
  private millisPassedSinceLastFrame: number;
  // Provides our Camera with objects to draw
  private scene: Array<SceneObject>;

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

    const debugCamera = new DebugCamera(() => origin, this.getScene, 
      new WorldBorderWithGrid(constants.TOP_LEFT_WORLD_BOUND, constants.BOTTOM_RIGHT_WORLD_BOUND));
    // Add a debug view to our game
    ioManager.addIOPair(
      debugCamera, 
      debugCamera.getKeyboardLayout()
    )
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
        for (let playerID in serverUpdate.players) {
          // Check if player is new
          let playerIsNew = !this.players.hasOwnProperty(playerID);
          if (playerIsNew) {
            let agent = new Agent(
              serverUpdate.players[playerID], 
              (pos: Vec2, size: Vec2) => {
                // TODO: figure out how to determine which player to draw (Snoopy vs Red Barron)
                ctx.drawImage(imageSnoopy, pos.x, pos.y, size.x, size.y);
              },
              { x: 100, y: 150 } // Will need to change this for drawing Red Barron sprite
            );
            this.players[playerID] = agent;
            
            let camera = new Camera(agent.getPosition, this.getScene, 
              new WorldBorderWithGrid(constants.TOP_LEFT_WORLD_BOUND, constants.BOTTOM_RIGHT_WORLD_BOUND));
            let keyboardLayout: KeyboardLayout;

            // @ts-ignore because playerID is a number, but TS thinks its a string because it's
            // coming from a key on an object.
            if (playerID == constants.PLAYER_IDX) {
              keyboardLayout = this.serverOutputKeyboardLayout();
            } else {
              keyboardLayout = doNothingKeyboardLayout;
            }
            ioManager.addIOPair(camera, keyboardLayout);
          }

          this.players[playerID].getServerUpdate(serverUpdate.players[playerID]);
        }

        // Update bullets
        for (let bulletID in serverUpdate.bullets) {
          let playerBullets = serverUpdate.bullets[bulletID];
          
          // Check if bullet is new
          let bulletIsNew = !this.bullets.hasOwnProperty(bulletID);
          if (bulletIsNew) this.bullets[bulletID] = []

          // Remove existing bullets from the scene
          this.bullets[bulletID] = [];
          
          for (let bullet of playerBullets) {
            let bulletObj = new Bullet(bullet.position, bullet.velocity);
            this.bullets[bulletID].push(bulletObj);
          }
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
        for (let bullet of this.bullets[bulletID]) {
          bullet.update(this.millisPassedSinceLastFrame / 1000);
        }
      }

      // Update the io manager so it can update the outputs
      ioManager.update(this.millisPassedSinceLastFrame / 1000);
      ioManager.renderOutput();

      this.millisPassedSinceLastFrame = 0;
    }

    this.before = now;
    requestAnimationFrame(this.gameLoop);
  }

  // TODO
  getScene = (): Array<SceneObject> => {
    let scene = [];

    for (let player of Object.values(this.players)) {
      scene.push(player);
    }

    for (let bulletGroup of Object.values(this.bullets)) {
      for (let bullet of bulletGroup) {
        scene.push(bullet);
      }
    }

    return scene;
  }

  // TODO
  serverOutputKeyboardLayout() {
      // Set up keyboard controls
      const onKeydown = (e: KeyboardEvent) => {
        this.serverUpdateManager.sendMessage(JSON.stringify({ actions: ioManager.getKeysDown()}));
      }
      const onKeyup = (e: KeyboardEvent) => {
        this.serverUpdateManager.sendMessage(JSON.stringify({ actions: ioManager.getKeysDown()}));
      }
      const onScroll = () => { /* Do nothing */ }
      const keyboardConfig = { onKeydown, onKeyup, onScroll }
      
      // Keep track of which keys are down at any point in time
      return keyboardConfig;
  }
}