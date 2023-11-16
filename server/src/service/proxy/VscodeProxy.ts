import * as websocket from 'websocket';
import * as moment from 'moment';
import getLogger from '@/utils/log4js';
import { parseMessage } from '@/utils/websocket/message';
import { isFalsyStr } from '@/utils/env';
import ScriptModel from '@/model/script.model';
import { WebSocketManager, WebSocketExt, IClientMessageListener } from '@/service/WebSocketManager';

const logger = getLogger('VscodeProxy');
const VscodeproxyOn = !isFalsyStr(process.env.VSCODE_EXT_PROXY_ON); // 默认是true
const VscodeExtensionIP = process.env.VSCODE_EXT_IP || 'localhost';
const VscodeExtensionPort = process.env.VSCODE_EXT_PORT || 9317;
const SaveOnRun = !isFalsyStr(process.env.VSCODE_EXT_SAVE_ON_RUN); // 默认是true

let count = 1;
const clientConnectListeners: Record<string | number, (connection: websocket.connection) => void> = {};
const serverCommandListeners: IClientMessageListener[] = [];
/**
 * 将device的socket的消息转发给其websocket服务器（例如vs code插件）
 */
export class VscodeProxy {
  static instance: VscodeProxy;
  private static targetUrl: string = `ws://${VscodeExtensionIP}:${VscodeExtensionPort}/`;

  public static getInstance() {
    if (!VscodeProxy.instance) {
      logger.info('Not initialized!');
    }
    return VscodeProxy.instance;
  }

  private static connectToServer() {
    const client = WebSocketManager.getInstance().wsClient;
    client.connect(this.targetUrl);

    client.on('connect', (connection: websocket.connection) => {
      logger.info(`connected to -> ${this.targetUrl}, config-${JSON.stringify({ SaveOnRun })}`);
      for (const id in clientConnectListeners) {
        const listener = clientConnectListeners[id];
        listener(connection);
      }
    });

    client.on('connectFailed', (err) => {
      logger.error(`connect failed!`, err);
    });
  }

  private static onServerCommandMessage(message: any, deviceConnection: WebSocketExt) {}

  public addServerCommandListener(listener: IClientMessageListener) {
    serverCommandListeners.push(listener);
  }

  public removeServerCommandListener(listener: IClientMessageListener) {
    serverCommandListeners.splice(serverCommandListeners.indexOf(listener), 1);
  }

  public static async onSaveCommand(deviceConnection, command) {
    const matches = (command.name || '').match(/.*\\?\\([^\\]+)\.js$/);
    const name = (matches && matches[1]) || '';
    const script = command.script;

    const scriptData = {
      script_name: name,
      script,
      script_args: command.args,
    };

    await ScriptModel.upsertBy('script_name', scriptData);
  }

  public static async onRunCommand(deviceConnection, command) {
    if (SaveOnRun) {
      await this.onSaveCommand(deviceConnection, command);
    }
  }

  private static onServerMessage(message: any, deviceConnection: WebSocketExt) {
    if (!message) {
      return;
    }

    if (message.type === 'hello') {
      logger.info(`handshake finish: device -> ${deviceConnection.name} `);
      this.removeClientConnectListener(deviceConnection.name); // 只执行一次建立连接的过程，建立完成后就删除监听器
    } else if (message.type === 'pong') {
      logger.debug(`on server pong device -> ${deviceConnection.name} -> ${JSON.stringify(message)}`);
    } else {
      if (message.type === 'command') {
        if (message.data) {
          logger.info(`on server command device -> ${deviceConnection.name} -> ${message.data.command}`);
          if (message.data.command === 'save') {
            this.onSaveCommand(deviceConnection, message.data);
          }
          if (message.data.command === 'run') {
            this.onRunCommand(deviceConnection, message.data);
          }
          serverCommandListeners.forEach((listener) => {
            listener(deviceConnection, message.data);
          });
        }
      }
      deviceConnection.sendUTF(JSON.stringify(message));
      // logger.info(`on server message device -> ${deviceConnection.name} -> ${JSON.stringify(message)}`, message.type);
    }
  }

  public static addClientConnectListener(id: string | number, listener: (connection: websocket.connection) => void) {
    clientConnectListeners[id] = listener;
  }

  public static removeClientConnectListener(id: string | number) {
    delete clientConnectListeners[id];
  }

  private static connectToServerByDevice(deviceConnection: WebSocketExt, hello) {
    const client = WebSocketManager.getInstance().wsClient;
    client.connect(this.targetUrl);
    const id = count++;

    this.addClientConnectListener(deviceConnection.name, (connection) => {
      logger.info(`connected, device -> ${deviceConnection.name} -> ${connection.socket.localPort} -> ${this.targetUrl} -> id${id}`);

      deviceConnection.vscodeConnection = connection;
      deviceConnection.vscodeConnection.on('message', (message) => {
        this.onServerMessage(parseMessage(message), deviceConnection);
      });
      deviceConnection.vscodeConnection.on('close', (code, message) => {
        logger.info(`server connection close, device -> ${deviceConnection.name} -> ${code} ${message}`);
        deviceConnection.vscodeConnection = null;
      });
      deviceConnection.vscodeConnection.on('error', (err) => {
        logger.error(`server connection error, device -> ${deviceConnection.name} -> ${err.message}`);
        deviceConnection.vscodeConnection = null;
      });
      deviceConnection.vscodeConnection && deviceConnection.vscodeConnection.sendUTF(JSON.stringify(hello));
    });
    // logger.info(`try connect -> ${deviceConnection.name} -> ${this.targetUrl}`);
  }

  private static async proxySetup() {
    // 建立服务端的连接
    this.connectToServer();

    // 转发设备的消息
    WebSocketManager.getInstance().addClientMessageListener((deviceConnection: WebSocketExt, message) => {
      if (deviceConnection.type !== 'device') {
        return;
      }

      logger.debug(`on client message, device -> ${deviceConnection.name} -> ${JSON.stringify(message)}`);

      if (message.type === 'hello') {
        this.connectToServerByDevice(deviceConnection, message);
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
        logger.info(`close, device -> ${client.name}`);
        // WebSocketManager.getInstance().sendUtf(client, { type: 'hello', data: { server_version: 2 } });
      }
    });
  }

  public static init() {
    if (!VscodeproxyOn) {
      logger.info('Switch off!');
      return;
    }

    if (!VscodeProxy.instance) {
      VscodeProxy.instance = new VscodeProxy();
    }

    this.proxySetup();
  }
}
