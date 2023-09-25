import * as websocket from 'websocket';
import getLogger from '@/utils/log4js';
import { parseMessage } from '@/utils/websocket/message';
import { WebSocketManager, WebSocketExt } from '../WebSocketManager';
import moment = require('moment');

const logger = getLogger('VscodeProxy');
const VscodeproxyOn = process.env.VSCODE_EXT_PROXY_ON || true;
const VscodeExtensionIP = process.env.VSCODE_EXT_IP || 'localhost';
const VscodeExtensionPort = process.env.VSCODE_EXT_PORT || 9317;

let count = 1;
/**
 * 将device的socket的消息转发给其websocket服务器（例如vs code插件）
 */
export class VscodeProxy {
  static instance: VscodeProxy;
  private static targetUrl: string = `ws://${VscodeExtensionIP}:${VscodeExtensionPort}/`;
  private static connection: websocket.connection;
  private static clientConnectListeners: Record<string | number, (connection: websocket.connection) => void> = {};

  public static getInstance() {
    if (!VscodeProxy.instance) {
      logger.info('VscodeProxy Not initialized!');
    }
    return VscodeProxy.instance;
  }

  private static connectToServer() {
    const client = WebSocketManager.getInstance().wsClient;
    client.connect(this.targetUrl);

    client.on('connect', (connection: websocket.connection) => {
      logger.info(`VscodeProxy connected to -> ${this.targetUrl}`);
      for (const id in this.clientConnectListeners) {
        const listener = this.clientConnectListeners[id];
        listener(connection);
      }
    });

    client.on('connectFailed', (err) => {
      logger.error(`VscodeProxy connect failed!`, err);
    });
  }

  private static onServerMessage(message: any, deviceConnection: WebSocketExt) {
    if (!message) {
      return;
    }

    if (message.type === 'hello') {
      logger.info(`VscodeProxy handshake finish: device -> ${deviceConnection.name} `);
      this.removeClientConnectListener(deviceConnection.name); // 只执行一次建立连接的过程，建立完成后就删除监听器
    } else if (message.type === 'pong') {
      // logger.debug(`VscodeProxy on server message device -> ${deviceConnection.name} -> ${JSON.stringify(message)}`);
    } else {
      deviceConnection.sendUTF(JSON.stringify(message));
      logger.debug(`VscodeProxy on server message device -> ${deviceConnection.name} -> ${JSON.stringify(message)}`, message.type);
    }
  }

  public static addClientConnectListener(id: string | number, listener: (connection: websocket.connection) => void) {
    this.clientConnectListeners[id] = listener;
  }

  public static removeClientConnectListener(id: string | number) {
    delete this.clientConnectListeners[id];
  }

  private static connectToServerByDevice(deviceConnection: WebSocketExt, hello) {
    const client = WebSocketManager.getInstance().wsClient;
    client.connect(this.targetUrl);
    // logger.info(`VscodeProxy try connect -> ${deviceConnection.name} -> ${this.targetUrl}`);

    // client.on('connectFailed', (err) => {
    //   logger.error(`VscodeProxy connect failed! device -> ${deviceConnection.name}`, err);
    // });
  }

  private static async proxySetup() {
    // 建立服务端的连接
    this.connectToServer();

    // 转发设备的消息
    WebSocketManager.getInstance().addClientMessageListener((deviceConnection: WebSocketExt, message) => {
      if (deviceConnection.type !== 'device') {
        return;
      }

      logger.debug(`VscodeProxy on client message device -> ${deviceConnection.name} -> ${JSON.stringify(message)}`);

      if (message.type === 'hello') {
        const id = count++;

        this.connectToServerByDevice(deviceConnection, message);
        this.addClientConnectListener(deviceConnection.name, (connection) => {
          logger.info(`VscodeProxy connected device -> ${deviceConnection.name} -> ${this.targetUrl} -> ${connection.socket.localPort} -> ${id}`);

          deviceConnection.vscodeConnection = connection;
          deviceConnection.vscodeConnection.on('message', (message) => {
            this.onServerMessage(parseMessage(message), deviceConnection);
          });
          deviceConnection.vscodeConnection.on('close', (code, message) => {
            logger.info(`VscodeProxy server connection close device -> ${deviceConnection.name} -> ${code} ${message}`);
            deviceConnection.vscodeConnection = null;
          });
          deviceConnection.vscodeConnection.on('error', (err) => {
            logger.error(`VscodeProxy server connection error device -> ${deviceConnection.name} -> ${err.message}`);
            deviceConnection.vscodeConnection = null;
          });
          deviceConnection.vscodeConnection && deviceConnection.vscodeConnection.sendUTF(JSON.stringify(message));
        });
      } else {
        if (deviceConnection.vscodeConnection) {
          deviceConnection.vscodeConnection.sendUTF(JSON.stringify(message));
        }
      }
    });

    WebSocketManager.getInstance().addDeviceLogListener((client, data) => {
      client.vscodeConnection && client.vscodeConnection.sendUTF(JSON.stringify(data));
    });

    WebSocketManager.getInstance().addClientStatusChangeListener((client, status) => {
      if (client.type === 'device' && status === 'close') {
        client.vscodeConnection && client.vscodeConnection.close();
        this.removeClientConnectListener(client.name);
        logger.info(`VscodeProxy close device -> ${client.name}`);
        // WebSocketManager.getInstance().sendUtf(client, { type: 'hello', data: { server_version: 2 } });
      }
    });
  }

  public static init() {
    if (!VscodeproxyOn) {
      logger.info('VscodeProxy Switch Off!');
      return;
    }

    if (!VscodeProxy.instance) {
      VscodeProxy.instance = new VscodeProxy();
    }

    this.proxySetup();

    WebSocketManager.getInstance().addClientRequestListeners(async (req) => {
      console.log('VscodeProxy on client request', req.connection.remoteAddress);

      return { type: 'device-proxy' };
    });

    // WebSocketManager.getInstance().addClientStatusChangeListener((client, status) => {
    //   if (status === 'open' && client.type === 'device') {
    //     WebSocketManager.getInstance().sendUtf(client, { type: 'hello', data: { server_version: 2 } });
    //   }
    // });
  }
}
