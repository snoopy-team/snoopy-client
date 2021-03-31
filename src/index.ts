import { Socket } from 'socket.io-client';
import { GameWorld } from './GameWorld.js';
import { ServerMock, ServerUpdateManager } from './ServerUtils.js';

export const canvas: HTMLCanvasElement = document.getElementById('game') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// This is what we'll be drawing to the canvas with
export const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

export const constants = {
  FPS: 10,
  // Most likely this will change to something a bit more fun (like a blue sky with clouds)
  BACKGROUND_COLOR: 'white',
  // Whether or not debugger info should be displayed
  DEBUG_MODE: true,
  SERVER_SOCKET_URL: 'todo: insert url here'
}

// Connect to remote socket for AI and multiplayer functionality
const socket = (window as any).io(constants.SERVER_SOCKET_URL) as Socket;
socket.on('connection', (socket: any) => {
  console.log('Server connected successfully');

  socket.on('disconnect', () => {
    console.log('Server disconnected');
  });
});

// Create update manager to serve as the in-between of the server and our game
const serverUpdateManager: ServerUpdateManager = new ServerUpdateManager(new ServerMock());

// Create world with update manager and begin game
let world: GameWorld = new GameWorld(serverUpdateManager);
world.gameLoop();

// At any given time, which keys are down?
export let keysDown: Array<String> = [];
document.addEventListener('keydown', (e) => {
  keysDown.push(e.key.toLowerCase());
  socket.emit(JSON.stringify(keysDown));
});
document.addEventListener('keyup', (e) => {
  keysDown = keysDown.filter((key) => key != e.key.toLowerCase());
  socket.emit(JSON.stringify(keysDown));
});