import * as querystring from 'querystring';
import * as http from 'http';
import getLogger from '@/utils/log4js';
import { verifyToken } from '@/middleware/app-jwt';
import { WebSocketManager, WebSocketExt } from './WebSocketManager';
import { VscodeProxy } from './proxy/VscodeProxy';

const logger = getLogger('AdminSocketManager');

export class AdminSocketManager {
  static instance: AdminSocketManager;

  public static getInstance() {
    if (!AdminSocketManager.instance) {
      logger.info('AdminSocketManager Not initialized!');
    }
    return AdminSocketManager.instance;
  }

  public static init() {
    if (!AdminSocketManager.instance) {
      AdminSocketManager.instance = new AdminSocketManager();
    }

    WebSocketManager.getInstance().addClientRequestListeners(async (req) => {
      const params = querystring.parse(req.url.replace('/?', ''));
      try {
        const data = await verifyToken(params.token as string);
        return { type: 'admin', extData: data };
      } catch (error) {
        return { type: null };
      }
    });

    WebSocketManager.getInstance().addDeviceLogListener((client, data) => {
      data.data.device = client.extData;
      WebSocketManager.getInstance().getClients('admin').forEach((c) => {
        WebSocketManager.getInstance().sendMessage(c, data);
      });
    });

    WebSocketManager.getInstance().addClientStatusChangeListener((client, status) => {
      if (client.type === 'device') {
        WebSocketManager.getInstance().getClients('admin').forEach((c) => {
          logger.info('WebSocket.Client device_change ip -> ' + client.ip + ' status -> ' + status);
          WebSocketManager.getInstance().sendMessage(c, { type: 'device_change', data: { status } });
        });
      }
    });

    VscodeProxy.getInstance().addServerCommandListener((deviceConnection, command) => {
      logger.debug('WebSocket.Client VscodeProxy command -> ' + JSON.stringify(command));
      WebSocketManager.getInstance().getClients('admin').forEach((c) => {
        logger.info('WebSocket.Client VscodeProxy command -> ' + ' message -> ' + command);
        // WebSocketManager.getInstance().sendMessage(c, message);
      });
    })
  }
}
