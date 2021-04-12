import { Socket } from "socket.io-client";
import { constants } from "./index.js";
import { Agent, AgentState } from "./Agents";
import { Bullet, BulletState } from "./Bullet";
import { Client, IMessage, Message } from '@stomp/stompjs';

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
  players: { [id: string]: AgentState; },
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
    console.log('raw:',rawServerUpdate);

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
    console.log(rawServerUpdate['players']);
    this.players = rawServerUpdate['players'];
    console.log(this.players);
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
          'example player id': {
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
          'example player id': {
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
          'example player id': {
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
            'example player id': {
              position: { x: 0, y: 0 },
              velocity: { x: 300, y: 300 },
              acceleration: { x: 0, y: 0 },
              orientation: 0,
              cooldown: 0,
            }, 
            'example player id 2': {
              position: { x: 0, y: 300 },
              velocity: { x: 300, y: -300 },
              acceleration: { x: 0, y: 0 },
              orientation: 0,
              cooldown: 0,
            }
          },
          bullets: {
            'example player id': [
              {
                position: { x: 0, y: 50 },
                velocity: { x: 50, y: 0 },
              },
              // {
              //   position: { x: 50, y: 0 },
              //   velocity: { x: 0, y: 50 },
              // },
            ],
            'example player id 2': [
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
  private keysDown: Array<string>;

  constructor() {
    this.updateObservers = [];
    this.keysDown = [];
  }

  addUpdateListener = (listener: (update: ServerUpdate) => void): void => {
    this.updateObservers.push(listener);
  };

  startProvidingUpdates = (): void => {
    // // Attempt 1: Raw websockets
    // let webSocket = new WebSocket(constants.SERVER_SOCKET_URL);
    // webSocket.onclose = () => console.log('socket closed');
    // webSocket.onerror = (e) => console.log('Error:', e);
    // webSocket.onopen = () => {
    //   console.log('Server connected successfully');

    //   // Keep track of which keys are down at any point in time and emit a message to server when
    //   // keys are pressed
    //   document.addEventListener('keydown', (e) => {
    //     this.keysDown.push(e.key.toLowerCase());
    //     webSocket.send(this.keysDown.join(','));
    //   });
    //   document.addEventListener('keyup', (e) => {
    //     this.keysDown = this.keysDown.filter((key) => key != e.key.toLowerCase());
    //     webSocket.send(this.keysDown.join(','));
    //   });

    //   webSocket.onmessage = (e) => {
    //     let message: string = e.data;
    //     if (message == 'some message title') {
    //       console.log(message);
    //     }
    //   }
    // }

    // // Attempt 2: Socket.io
    // // Connect to remote socket for AI and multiplayer functionality
    // const socket = (window as any).io(constants.SERVER_SOCKET_URL) as Socket;
    // socket.on('connect', () => {
    //   let decoder = new TextDecoder("utf-8");
    //   console.log('Server connected successfully');

    //   // Keep track of which keys are down at any point in time and emit a message to server when
    //   // keys are pressed
    //   document.addEventListener('keydown', (e) => {
    //     this.keysDown.push(e.key.toLowerCase());
    //     socket.emit('example message', this.keysDown.join(','));
    //   });
    //   document.addEventListener('keyup', (e) => {
    //     this.keysDown = this.keysDown.filter((key) => key != e.key.toLowerCase());
    //     socket.emit('example message', this.keysDown.join(','));
    //   });

    //   socket.on('example message', (data) => {
    //     // this is where I take `data` and broadcast an update
    //     console.log(this.getFirstJSONUpdate(decoder.decode(data)));
    //     // this.broadcastUpdate(JSON.parse(decoder.decode(data)));
    //   });

    //   socket.on('disconnect', () => {
    //     console.log('Server disconnected');
    //   });
    // });

    // // Attempt 3: Using a Maintained STOMP (protocol for websockets) library
    // let stompClient: (StompJs.Client as Client);

    // const stompConfig = {
    //   // Typically login, passcode and vhost
    //   // Adjust these for your broker
    //   // connectHeaders: {
    //   //   login: "guest",
    //   //   passcode: "guest"
    //   // },

    //   // Broker URL, should start with ws:// or wss:// - adjust for your broker setup
    //   // brokerURL: "ws://localhost:15674/ws",
    //   brokerURL: constants.SERVER_SOCKET_URL,

    //   // Keep it off for production, it can be quit verbose
    //   // Skip this key to disable
    //   debug: function (str: string) {
    //     console.log('STOMP: ' + str);
    //   },

    //   // If disconnected, it will retry after 200ms
    //   reconnectDelay: 200,

    //   // Subscriptions should be done inside onConnect as those need to reinstated when the broker reconnects
    //   onConnect: (frame: any) => {
    //     // The return object has a method called `unsubscribe`
    //     const subscription = stompClient.subscribe('/topic/chat', (message: IMessage) => {
    //       const payload = JSON.parse(message.body);
    //       // Do something with `payload` (object with info from server)
    //       console.log(payload)
    //     });
    //   }
    // };

    // // Create an instance
    // stompClient = new StompJs.Client(stompConfig);
    
    // // You can set additional configuration here

    // // Attempt to connect
    // stompClient.activate();

    // // Attempt 4: Use a deprecated STOMP library :(
    // Ignore the fact that we're using SockJS and Stomp for websockets.
    // @ts-ignore 
    let socket = new SockJS('/gs-guide-websocket');
    // @ts-ignore
    let stompClient = Stomp.over(socket);
    stompClient.connect({}, (frame: any) => {
      console.log('Connected: ' + frame);
      stompClient.subscribe('/topic/greetings', (greeting: any) => {
        // console.log(JSON.parse(greeting.body));
        this.broadcastUpdate(new RawServerUpdateWrapper(JSON.parse(greeting.body)));
      });

      // Keep track of which keys are down at any point in time
      document.addEventListener('keydown', (e) => {
        if (!this.keysDown.includes(e.key)) {
          this.keysDown.push(e.key.toLowerCase());
        }
      });
      document.addEventListener('keyup', (e) => {
        this.keysDown = this.keysDown.filter((key) => key != e.key.toLowerCase());
      });

      // Every 30 ms, ping the server with our current keysdown because we made the design
      // decision that the frontend should control every time the backend game loop steps forward 1
      // time step. :(
      setInterval(() => {
        let out = JSON.stringify({ actions: this.keysDown });
        stompClient.send("/app/hello", {}, out);
      }, 30);
    });

  }

  /**
   * Provide the given update to all observers to this server
   */
  broadcastUpdate = (update: ServerUpdate) => {
    this.updateObservers.forEach(updateObserver => updateObserver(update));
  }

  // TODO
  private getFirstJSONUpdate(jsonStr: string): string {
    let i = 1;
    let numClosingBracesNeeded = 1;
    let firstJSONObj = "";

    let currChar = jsonStr[0];
    while (currChar != undefined) {
      let currChar = jsonStr[i];
      
      if (jsonStr[i] == '{') {
        numClosingBracesNeeded++;
      } else if (jsonStr[i] == '}') {
        numClosingBracesNeeded--
      }

      firstJSONObj += currChar;

      if (numClosingBracesNeeded == 0) {
        return firstJSONObj;
      }
      
      i++;
    }

    return "";
  }
}