import { GameWorld } from './GameWorld.js';
import { GridBackground } from './GridBackground.js';
import { ServerMock, ServerUpdateManager } from './ServerUtils.js';

export const canvas: HTMLCanvasElement = document.getElementById('game') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// This is what we'll be drawing to the canvas with
export const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

export const constants = {
  FPS: 30,
  // Most likely this will change to something a bit more fun (like a blue sky with clouds)
  BACKGROUND_COLOR: 'white',
  // Whether or not debugger info should be displayed
  DEBUG_MODE: true,
  SERVER_SOCKET_URL: 'todo: insert url here'
}

// Create update manager to serve as the in-between of the server and our game
const serverUpdateManager: ServerUpdateManager = new ServerUpdateManager(new ServerMock());

// Define some visual backgrounds for our game
const drawBlankBG = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = constants.BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const drawGridBG = (ctx: CanvasRenderingContext2D) => {
  const grid: GridBackground = new GridBackground();
  grid.draw(ctx, { x: 25, y: 25 }, {x: canvas.width, y: canvas.height}, { x: 50, y: 50 });
}

// Create world with update manager and begin game
let world: GameWorld = new GameWorld(serverUpdateManager, drawBlankBG);
world.gameLoop();