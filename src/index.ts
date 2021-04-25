import { GameWorld } from './GameWorld.js';
import { GridBackground } from './GridBackground.js';
import { IOManager } from './IOManager.js';
import { KeyboardManager } from './KeyboardManager.js';
import { LiveServer, ServerMock, ServerUpdateManager } from './ServerUtils.js';

export const canvas: HTMLCanvasElement = document.getElementById('game') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// This is what we'll be drawing to the canvas with
export const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
// flip y-axis
ctx.transform(1, 0, 0, -1, 0, canvas.height);

export const constants = {
  FPS: 30,
  // Most likely this will change to something a bit more fun (like a blue sky with clouds)
  BACKGROUND_COLOR: 'white',
  // Whether or not debugger info should be displayed
  DEBUG_MODE: true,
  SERVER_SOCKET_URL: 'ws://127.0.0.1:8080/gs-guide-websocket',
  AI_IDX: 0,
  PLAYER_IDX: 1,
  SNOOPY_SIZE: { x: 30, y: 50 },
  BARRON_SIZE: { x: 30, y: 20 },
  TOP_LEFT_WORLD_BOUND: { x: -30, y: 0 }, // x should be = to negative Snoopy's width
  BOTTOM_RIGHT_WORLD_BOUND: { x: 1000, y: 1000 },
}

// Initialize an IO manager to keep track of which inputs correspond with which outputs
export const ioManager = new IOManager();

// -------- Load assets --------
// -> Snoopy image
let snoopyImageLoaded = false;
export const imageSnoopy = new Image();
imageSnoopy.onload = () => snoopyImageLoaded = true; 
imageSnoopy.src = '../assets/hq/snoopy_hq.png';
// -> Red Barron image
let barronImageLoaded = false;
export const imageBarron = new Image();
imageBarron.onload = () => barronImageLoaded = true; 
imageBarron.src = '../assets/hq/red_barron.png';
// -> Clouds 1-4
export const clouds = [new Image(), new Image(), new Image(), new Image()];
const cloudImagesLoaded = [false, false, false, false];
for (let i = 1; i <= 4; i++) {
  let imageCloud = clouds[i - 1];
  imageCloud.onload = () => cloudImagesLoaded[i - 1] = true; 
  imageCloud.src = '../assets/pixelated/clouds/cloud' + i + '.png';
}

// Start game after assets have loaded. Check if they've loaded every `checkLoadedFreq` milliseconds
let checkLoadedFreq = 33;
let loadTimer = setInterval(() => {
  let allCloudsLoaded = true;
  for (let cloudLoaded of cloudImagesLoaded) {
    if (!cloudLoaded) {
      allCloudsLoaded = false;
    }
  }
  if (snoopyImageLoaded && barronImageLoaded && allCloudsLoaded) {
    // Stop timer
    clearInterval(loadTimer);

    // Create update manager to serve as the in-between of the server and our game
    const serverUpdateManager: ServerUpdateManager = new ServerUpdateManager(new LiveServer());

    // Create world with update manager and begin game
    let world: GameWorld = new GameWorld(serverUpdateManager);
    world.gameLoop();
  }
}, checkLoadedFreq);