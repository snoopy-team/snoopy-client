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

// Load assets
// -> Snoopy image
let snoopyImageLoaded = false;
export const imageSnoopy = new Image();
imageSnoopy.onload = () => snoopyImageLoaded = true; 
imageSnoopy.src = '../public/assets/hq/snoopy_hq.png';
// -> Red Barron image
let barronImageLoaded = false;
export const imageBarron = new Image();
imageBarron.onload = () => barronImageLoaded = true; 
imageBarron.src = '../public/assets/hq/red_barron.png';

// Start game after assets have loaded. Check if they've loaded every `checkLoadedFreq` milliseconds
let checkLoadedFreq = 33;
let loadTimer = setInterval(() => {
  if (snoopyImageLoaded && barronImageLoaded) {
    // Stop timer
    clearInterval(loadTimer);

    // Create update manager to serve as the in-between of the server and our game
    const serverUpdateManager: ServerUpdateManager = new ServerUpdateManager(new ServerMock());

    // Create world with update manager and begin game
    let world: GameWorld = new GameWorld(serverUpdateManager);
    world.gameLoop();
  }
}, checkLoadedFreq);