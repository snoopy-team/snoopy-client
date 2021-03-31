import { Agent, AgentState } from "./Agents";
import { BulletState } from "./Bullet";

/**
 * Represents a Server which will provide the client with new state updates 
 */
export interface Server {
  /**
   * Add a function that will be called with a new ServerUpdate when the Server encounters an update
   */
   addUpdateListener: (listener: (update: ServerUpdate) => void) => void,

   /**
    * Begin grabbing updates from our information source (local or some remote server)
    */
   startProvidingUpdates: VoidFunction
}

/**
 * The information necessary for a server to broadcast an update
 */
export type ServerUpdate = {
  players: Array<AgentState>,
  bullets: Array<BulletState>
}

/**
 * Holds a server and provides information about the latest update, if there has been an update
 * since the last time a client checked.
 */
export class ServerUpdateManager {
  private hasUpdateFlag;
  private mostRecentUpdate: ServerUpdate;
  private serverUpdateProvider: Server;

  /**
   * Constructs a new ServerUpdateManager that has no initial updates.
   * @param serverUpdateProvider whatever the source of information is, whether an actual server or
   * a local server with mock data (i.e. ServerMock).
   */
  constructor(serverUpdateProvider: Server) {
    this.serverUpdateProvider = serverUpdateProvider;
    this.hasUpdateFlag = false
    this.mostRecentUpdate = {
      players: [],
      bullets: []
    };
  }

  /**
   * Returns if there's been a new update since the last time the client got an update
   */
  hasUpdate = () => this.hasUpdateFlag;

  /**
   * Gets the most recent update. Calling this will make hasUpdate() return false.
   */
  getUpdate = (): ServerUpdate => {
    this.hasUpdateFlag = false;
    return this.mostRecentUpdate;
  }

  /**
   * Register a new update with this update manager
   */
  acceptUpdate = (update: ServerUpdate): void => {
    this.hasUpdateFlag = true;
    this.mostRecentUpdate = update;
  }

  /**
   * Tells the server that we're ready to get updates at which point, it will provide us with a
   * stream of updates.
   */
  beginRequestingUpdates = () => {
    this.serverUpdateProvider.addUpdateListener(this.acceptUpdate);
    this.serverUpdateProvider.startProvidingUpdates();
  }
}

/**
 * A class that will help us visually test our code by mocking input from the server.
 */
export class ServerMock {
  // Functions that will run when this server encounters new updates.
  private updateObservers: Array<(update: ServerUpdate) => void>;

  constructor() {
    this.updateObservers = [];
  }

  /**
   * Starts providing mock data
   */
  startProvidingUpdates = () => {
    this.oneSecIntervalUpdates();
  }

  /**
   * Add the given update callback to call when we receive a new update from the server
   */
  addUpdateListener = (onUpdate: (update: ServerUpdate) => void) => {
    this.updateObservers.push(onUpdate);
  }

  /**
   * Provide the given update to all observers to this server
   */
  broadcastUpdate = (update: ServerUpdate) => {
    this.updateObservers.forEach(updateObserver => updateObserver(update));
  }

  /**
   * Provides some manually defined updates to the server manager at a rate of one second.
   */
  oneSecIntervalUpdates = (): void => {
    let mockData: Array<ServerUpdate> = [
      {
        players: [{
          id: 'example player id',
          position: { x:50, y:50 },
          velocity: { x:10, y:10 },
          acceleration: { x:0, y:0 },
          orientation: 0,
          cooldown: 0,
        }],
        bullets: []
      },
      {
        players: [{
          id: 'example player id',
          position: { x:100, y:100 },
          velocity: { x:5, y:5 },
          acceleration: { x:0, y:0 },
          orientation: Math.PI, // half rotation
          cooldown: 0,
        }],
        bullets: []
      },
      {
        players: [{
          id: 'example player id',
          position: { x:100, y:50 },
          velocity: { x:10, y:10 },
          acceleration: { x:0, y:0 },
          orientation: 2 * Math.PI, // full rotation
          cooldown: 0,
        }],
        bullets: [{
          id: 'example bullet id',
          position: { x: 50, y: 50 },
          velocity: { x: 30, y: 5 }
        }]
      },
    ];

    let i = 0;
    setInterval(() => {
      if (i < mockData.length) {
        this.broadcastUpdate(mockData[i])
        i++;
      }
    }, 1000);
  }
}