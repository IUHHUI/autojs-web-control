import * as querystring from 'querystring';
import * as http from 'http';
import * as moment from 'moment';
import getLogger from '@/utils/log4js';
import ScriptModel from '@/model/script.model';
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

    VscodeProxy.getInstance().addServerCommandListener(async (deviceConnection, command) => {
      logger.debug('WebSocket.Client VscodeProxy command -> ' + JSON.stringify(command));
      if (command.command === 'save') {
        const matches = (command.name || '').match(/.*\\?\\([^\\]+)\.js$/);
        const name = (matches && matches[1]) || '';
        const script = command.script;

        const scriptData = {
          script_name: name,
          script,
          script_args: command.args,
          create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        };
        // logger.info('WebSocket.Client VscodeProxy command -> ' + ' message -> ' + JSON.stringify(command));

        WebSocketManager.getInstance().getClients('admin').forEach(async (c) => {
          WebSocketManager.getInstance().sendMessage(c, { type: 'command', data: command });
        });

        await ScriptModel.upsertBy('script_name', scriptData);
      }
    })
  }
}
