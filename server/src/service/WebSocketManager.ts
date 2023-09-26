import { EventEmitter } from 'events';
import * as querystring from 'querystring';
import * as http from 'http';
import * as websocket from 'websocket';
import getLogger from '@/utils/log4js';
import { ipFromWebSocket } from '@/utils/ip';
import { parseMessage } from '@/utils/websocket/message';
import { Buffer } from 'buffer';

const logger = getLogger('WebSocketManager');

export type WebSocketData = any;
export interface WebSocketExt extends websocket.connection {
  isAlive: boolean;
  ip: string;
  type: 'device' | 'admin';
  name: string;
  extData?: any;
  vscodeConnection?: websocket.connection;
}
export type IClientRequestListener = (
  req: http.IncomingMessage,
) => Promise<{ type: string; extData?: any }>;
export type IClientMessageListener = (
  client: WebSocketExt,
  data: WebSocketData,
) => void;
export type IClientStatusChangeListener = (
  client: WebSocketExt,
  status: 'open' | 'close' | 'error',
) => void;
export type IDeviceLogListener = (client: WebSocketExt, log: any) => void;

const clientRequestListeners: IClientRequestListener[] = [];
const clientMessageListeners: IClientMessageListener[] = [];
const clientStatusChangeListeners: IClientStatusChangeListener[] = [];
const deviceLogListeners: IClientStatusChangeListener[] = [];
const messageAnswer = new Map<object, any>();

export const bufferFromString = Buffer.from
  ? Buffer.from
  : function oldBufferFromString(string, encoding) {
      return new Buffer(string, encoding);
    };

export class WebSocketManager extends EventEmitter {
  static instance: WebSocketManager;

  private httpServer: http.Server;
  private wss: websocket.server;
  public wsClient: websocket.client;
  private pingTimeout: NodeJS.Timeout;

  public static init(server: http.Server) {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(server);
    }
    WebSocketManager.instance.ping();
    return WebSocketManager.instance;
  }

  public static getInstance() {
    if (!WebSocketManager.instance) {
      logger.info('WebSocketManager Not initialized!');
    }
    return WebSocketManager.instance;
  }

  private constructor(server: http.Server) {
    super();
    this.httpServer = server;
    this.wss = new websocket.server({
      httpServer: this.httpServer,
      keepalive: true,
      keepaliveInterval: 10000,
    });
    this.wsClient = new websocket.client({
      closeTimeout: 5000
    })
    this.setListeners();
  }

  private setListeners() {
    this.wss.on('request', (request) => {
      this.authenticate(request.httpRequest, (authenticateInfo) => {
        const connection = request.accept() as WebSocketExt;
        if (!connection) {
          return;
        }

        logger.debug('authenticateInfo', authenticateInfo);
        if (authenticateInfo.type) {
          // this.wss.handleUpgrade(request.httpRequest, connection.socket);

          connection.type = authenticateInfo.type as WebSocketExt['type'];
          connection.extData = authenticateInfo.extData;

          this.onWebSocketConnection(connection, request.httpRequest);
        }
      });
      // logger.debug('request connection', connection.remoteAddress);
    });

    this.addListener('error', (err: Error) => {
      logger.error('WebSocket.Server error -> ' + err.message);
    });
  }

  private ping() {
    if (!this.pingTimeout) {
      this.pingTimeout = setInterval(() => {
        this.wss.connections.forEach((ws: WebSocketExt) => {
          if (ws.isAlive === false) {
            return ws.drop();
          }
          ws.isAlive = false;
          ws.ping(() => {});
        });
      }, 3000);
    }
  }

  private async authenticate(
    req: http.IncomingMessage,
    cb: (d: { type: string; extData?: any }) => void,
  ) {
    let type = '';
    let extData = null;
    for (let i = 0; i < clientRequestListeners.length; i++) {
      const r = await clientRequestListeners[i](req);
      if (!type && r.type) {
        type = r.type;
      }
      extData = r.extData || extData;
    }
    cb({ type, extData });
  }

  private async onWebSocketConnection(
    client: WebSocketExt,
    req: http.IncomingMessage,
  ) {
    client.ip = ipFromWebSocket(client, req);

    logger.info(
      'WebSocket.Server connection client ip -> ' +
        client.ip +
        ' url -> ' +
        req.url,
    );

    client.addListener('close', (code: number, message: string) => {
      logger.info(
        'WebSocket.Client close ip -> ' +
          client.ip +
          ' code -> ' +
          code +
          ' message-> ' +
          message,
      );
      clientStatusChangeListeners.forEach((listener) => {
        listener(client, 'close');
      });
    });

    client.addListener('error', (err: Error) => {
      logger.info(
        'WebSocket.Client error ip -> ' +
          client.ip +
          ' message-> ' +
          err.message,
      );
      clientStatusChangeListeners.forEach((listener) => {
        listener(client, 'error');
      });
    });

    client.addListener('message', (message: websocket.Message) => {
      const json = parseMessage(message);
      logger.debug("on client message: ", json);

      if (json.type === 'respond') {
        const answer = messageAnswer.get(json.message_id);
        answer && answer(null, json);
      } else if (json.type === 'log') {
        deviceLogListeners.forEach((listener) => {
          listener(client, json);
        });
      } else {
        clientMessageListeners.forEach(async (listener) => {
          await listener(client, json);
        });

        if (json.type === 'hello') {
          clientStatusChangeListeners.forEach((listener) => {
            listener(client, 'open');
          });
        }
      }
    });

    client.isAlive = true;
    client.on('pong', () => {
      client.isAlive = true;
    });


    logger.info('WebSocket.Client open ip -> ' + client.ip);
  }

  public addDeviceLogListener(listener: IDeviceLogListener) {
    deviceLogListeners.push(listener);
  }

  public addClientRequestListeners(listener: IClientRequestListener) {
    clientRequestListeners.push(listener);
  }

  public addClientMessageListener(listener: IClientMessageListener) {
    clientMessageListeners.push(listener);
  }

  public addClientStatusChangeListener(listener: IClientStatusChangeListener) {
    clientStatusChangeListeners.push(listener);
  }

  public sendMessage(
    client: websocket.connection,
    message: any,
    cb?: (err: Error, data?: any) => {},
  ) {
    if (client.state === 'open') {
      message.message_id = `${Date.now()}_${Math.random()}`;
      logger.debug(`send message -> ${JSON.stringify(message)}`);
      client.send(JSON.stringify(message), (err: Error) => {
        if (err) {
          logger.error(`send message appear error, message -> ${err.message}`);
          cb(err);
        } else {
          messageAnswer.set(message.message_id, cb);
        }
      });
    }
  }

  public sendUtf(
    client: websocket.connection,
    message: any,
    cb?: (err: Error, data?: any) => {},
  ) {
    if (client.state === 'open') {
      message.message_id = `${Date.now()}_${Math.random()}`;
      logger.debug(`send utf message -> ${JSON.stringify(message)}`);
      return client.sendUTF(JSON.stringify(message), cb);
    }
  }

  public broadcast(message: object) {
    for (const ws of this.wss.connections.values()) {
      this.sendMessage(ws, message);
    }
  }

  public sendMessageToClients(
    clients: websocket.connection[],
    message: object,
  ) {
    clients.forEach((client) => {
      this.sendMessage(client, message);
    });
  }

  public getClients() {
    return this.wss.connections as WebSocketExt[];
  }
}
