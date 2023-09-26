import * as querystring from 'querystring';
import * as http from 'http';
import getLogger from '@/utils/log4js';
import DeviceModel from '@/model/device.model';
import { WebSocketManager, WebSocketExt } from './WebSocketManager';
import moment = require('moment');

const DEBUG = false;
const logger = getLogger('DeviceManager');

export class DeviceManager {
  static instance: DeviceManager;

  public static getInstance() {
    if (!DeviceManager.instance) {
      logger.info('DeviceManager Not initialized!');
    }
    return DeviceManager.instance;
  }

  private static async upsertDevice(params: {name?: string, ip?: string}) {
    const { name, ip } = params;
    const deviceName = name || ip;

    // let device = await DeviceModel.getByDeviceName(deviceName as string);
    // // let device = await DeviceModel.getUnion(deviceName, ip);
    // if (!device) {
    //   await DeviceModel.insert({ name: deviceName, ip, create_time: moment().format('YYYY-MM-DD HH:mm:ss') });
    // }

    // // device = await DeviceModel.getByDeviceName(deviceName);
    // await DeviceModel.updateById(device.device_id, { connect_time: moment().format('YYYY-MM-DD HH:mm:ss') });
    let device = { name: deviceName, ip, connect_time: moment().format('YYYY-MM-DD HH:mm:ss') };
    await DeviceModel.upsertBy('name', device);

    return device;
  }

  private static async clientHelloListener(client: WebSocketExt, data) {
    // logger.debug("on client hello: ", data);
    client.name = data['device_name'];
    let appVersionCode = data['app_version_code']
    client.extData = await this.upsertDevice({ name: client.name, ip: client.ip });

    let returnData
    if (appVersionCode >= 629) {
      returnData = { data: "ok", version: '1.109.0', debug: DEBUG, type: 'hello' }
    } else {
      returnData = { data: "连接成功", debug: DEBUG, type: 'hello' }
    }

    logger.debug("return data: ", returnData)
    WebSocketManager.getInstance().sendUtf(client, returnData);
  }

  private static clientPingListener(client: WebSocketExt, data) {
    logger.debug("on client ping: ", data);
    var returnData = { type: 'pong', data: data }
    logger.debug("pong: ", returnData)
    WebSocketManager.getInstance().sendUtf(client, returnData);
  }

  public static init() {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }

    WebSocketManager.getInstance().addClientRequestListeners(async (req) => {
      const params = querystring.parse(req.url.replace('/?', ''));
      if (params.token) {
        return { type: null };
      }
      // const ip = (req.connection.remoteAddress || (req.headers['x-forwarded-for'] as any || '').split(/\s*,\s*/)[0]).replace(/[^0-9\.]/ig, '');

      // const deviceName = params.name || ip;

      // let device = await DeviceModel.getByDeviceName(deviceName as string);
      // if (!device) {
      //   await DeviceModel.insert({ name:deviceName, ip, create_time: moment().format('YYYY-MM-DD HH:mm:ss') });
      // }

      // device = await DeviceModel.getByDeviceName(deviceName);
      // await DeviceModel.updateById(device.device_id, { connect_time: moment().format('YYYY-MM-DD HH:mm:ss') });

      return { type: 'device' };
    });

    // WebSocketManager.getInstance().addClientStatusChangeListener((client, status) => {
    //   if (status === 'open' && client.type === 'device') {
    //     WebSocketManager.getInstance().sendUtf(client, { type: 'hello', data: { server_version: 2 } });
    //   }
    // });

    WebSocketManager.getInstance().addClientMessageListener(async (client, message) => {
      // logger.debug('WebSocket.Client onClientMessage -> ' + client.type + ' message -> ' + JSON.stringify(message || 'NULL'));
      if (client.type === 'device') {
        // const message = JSON.parse(data as string);
        if (message.type === 'hello') {
          // client.extData.device_name = message.data.device_name;
          await this.clientHelloListener(client, message.data);
        } else if (message.type === 'ping') {
          this.clientPingListener(client, message.data);
        }
      }
    });
  }

  public getOnlineDevices() {
    const deviceClients = [];
    WebSocketManager.getInstance().getClients().forEach((c) => {
      if (c.type === 'device' && c.extData) {
        deviceClients.push({
          ip: c.ip,
          device_name: c.extData.name,
        });
      }
    });
    return deviceClients;
  }

  public disconnectDeviceByIp(ip: string) {
    WebSocketManager.getInstance().getClients().forEach((c) => {
      if (c.type === 'device' && c.ip === ip) {
        c.drop();
      }
    });
  }

  public disconnectDeviceByName(name: string) {
    WebSocketManager.getInstance().getClients().forEach((c) => {
      if (c.type === 'device' && c.extData.name === name) {
        c.drop();
      }
    });
  }
}
