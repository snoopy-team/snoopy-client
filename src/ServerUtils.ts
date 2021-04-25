import { AgentState } from "./Agents";
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
   startProvidingUpdates: VoidFunction,

   /**
    * Send a message to the endpoint where we're listening to.
    */
   sendMessage: (msg: string) => void
}

/**
 * The information necessary for a server to broadcast an update
 */
export type ServerUpdate = {
  players: { [id: number]: AgentState; },
  bullets: {
    [id: string]: BulletState[]
  }
}

// Wraps a raw server update to have it conform to an actual ServerUpdate. This means taking the
// data in a raw server update and converting it into Vec2's, instead of the arrays of size 2 which
// are given from the server.
class RawServerUpdateWrapper {
  players: { [id: string]: AgentState; };
  bullets: { [id: string]: BulletState[] }
  
  constructor(rawServerUpdate: any) {
    // console.log('raw:',rawServerUpdate);

    // Translate all arrays of size 2, which represent vectors, to `Vec2`s
    // Convert players data
    for (let playerID in rawServerUpdate['players']) {
      let player = rawServerUpdate['players'][playerID];

      let acceleration = player['acceleration'];
      player['acceleration'] = { x: acceleration[0], y: acceleration[1] };

      let position = player['position'];
      player['position'] = { x: position[0], y: position[1] };

      let velocity = player['velocity'];
      player['velocity'] = { x: velocity[0], y: velocity[1] };
    }

    // Convert bullets data
    for (let bulletID in rawServerUpdate['bullets']) {
      for (let bullet of rawServerUpdate['bullets'][bulletID]) {
        let position = bullet['position'];
        bullet['position'] = { x: position[0], y: position[1] };
  
        let velocity = bullet['velocity'];
        bullet['velocity'] = { x: velocity[0], y: velocity[1] };
      }
    }

    // Set properties of this ServerUpdate
    this.players = rawServerUpdate['players'];
    this.bullets = rawServerUpdate['bullets'];
  }
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
      players: {},
      bullets: {}
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

  /**
   * Sends a message to the endpoint that we're interacting with.
   */
  sendMessage = (msg: string) => {
    this.serverUpdateProvider.sendMessage(msg);
  }
}

/**
 * A class that will help us visually test our code by mocking input from the server.
 */
export class ServerMock implements Server {
  // Functions that will run when this server encounters new updates.
  private updateObservers: Array<(update: ServerUpdate) => void>;

  constructor() {
    this.updateObservers = [];
  }

  /**
   * Does nothing because a ServerMock doesn't actually conncet to a Server.
   */
  sendMessage(msg: string) {
    // do nothing
  }

  /**
   * Starts providing mock data
   */
  startProvidingUpdates = () => {
    this.oneSecondSineMotion();
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
        players: {
          0: {
            position: { x:0, y:0 },
            velocity: { x:200, y:200 },
            acceleration: { x: 0, y: -50 },
            orientation: 0,
            cooldown: 0,
          },
        },
        bullets: {}
      },
      {
        players: {
          0: {
            position: { x:100, y:100 },
            velocity: { x:5, y:5 },
            acceleration: { x:0, y:0 },
            orientation: Math.PI, // half rotation
            cooldown: 0,
          }
        },
        bullets: {}
      },
      {
        players: {
          0: {
            position: { x:100, y:50 },
            velocity: { x:0, y:0 },
            acceleration: { x:0, y:0 },
            orientation: 2 * Math.PI, // full rotation
            cooldown: 0,
          }
        },
        bullets: {}
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

  oneSecondSineMotion = (): void => {
    let flag = true;

    let sineMotion = (toggleFlag: boolean): ServerUpdate => {
      // if (toggleFlag) {
        return {
          players: {
            0: {
              position: { x: 0, y: 0 },
              velocity: { x: 300, y: 300 },
              acceleration: { x: 0, y: 0 },
              orientation: 0,
              cooldown: 0,
            }, 
            1: {
              position: { x: 0, y: 300 },
              velocity: { x: 300, y: -300 },
              acceleration: { x: 0, y: 0 },
              orientation: 0,
              cooldown: 0,
            }
          },
          bullets: {
            0: [
              {
                position: { x: 0, y: 50 },
                velocity: { x: 50, y: 0 },
              },
              // {
              //   position: { x: 50, y: 0 },
              //   velocity: { x: 0, y: 50 },
              // },
            ],
            1: [
              {
                position: { x: 0, y: 0 },
                velocity: { x: 50, y: 100 },
              },
              // {
              //   position: { x: 50, y: 50 },
              //   velocity: { x: 0, y: -50 },
              // },
            ],
          }
        }
      // } else {
      //   return {
      //     players: [
      //       {
      //         id: 'example player id',
      //         position: { x: 300, y: 300 },
      //         velocity: { x: -300, y: -300 },
      //         acceleration: { x: 0, y: 0 },
      //         orientation: 0,
      //         cooldown: 0,
      //       },
      //       {
      //         id: 'example player id 2',
      //         position: { x: 300, y: 0 },
      //         velocity: { x: -300, y: 300 },
      //         acceleration: { x: 0, y: 0 },
      //         orientation: 0,
      //         cooldown: 0,
      //       }
      //     ],
      //     bullets: []
      //   }
      // }
    }

    setInterval(() => {
      this.broadcastUpdate(sineMotion(flag));
      flag = !flag;
    }, 1000);
  }
}

/**
 * A message receiver for the live server.
 */
export class LiveServer implements Server {
  private updateObservers: Array<(update: ServerUpdate) => void>;
  private stompClient: any;
  private currentMessage: string;

  constructor() {
    this.updateObservers = [];
    // Ignore the fact that we're using client libraries (as opposed to NPM) for SockJS and Stomp to
    // websockets.
    // @ts-ignore 
    let socket = new SockJS('/gs-guide-websocket');
    // @ts-ignore
    this.stompClient = Stomp.over(socket);
    this.currentMessage = JSON.stringify({ actions: [] });
  }

  sendMessage(msg: string): void {
    this.currentMessage = msg;
  }

  addUpdateListener = (listener: (update: ServerUpdate) => void): void => {
    this.updateObservers.push(listener);
  };

  startProvidingUpdates = (): void => {
    // this.stompClient.debug = null
    this.stompClient.connect({}, (frame: any) => {
      console.log('Connected: ' + frame);
      this.stompClient.subscribe('/game/to-client', (greeting: any) => {
        // console.log(JSON.parse(greeting.body));
        this.broadcastUpdate(new RawServerUpdateWrapper(JSON.parse(greeting.body)));
      });

      // Every 30 ms, ping the server with our current keysdown because we made the design
      // decision that the frontend should control every time the backend game loop steps forward 1
      // time step.
      setInterval(() => {
        let out = this.currentMessage;
        this.stompClient.send("/app/to-server", {}, out);
      }, 30);
    });

  }

  /**
   * Provide the given update to all observers to this server
   */
  broadcastUpdate = (update: ServerUpdate) => {
    this.updateObservers.forEach(updateObserver => updateObserver(update));
  }
}