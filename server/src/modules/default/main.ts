/**
 * @Author: kun
 * 2019-10-25
 */
// require('module-alias/register');
// moduleAlias.addAlias('@', __dirname + '../../')
const moduleAlias = require('module-alias');
moduleAlias.addPath(__dirname + '../../../lib')
moduleAlias.addAlias('@', (fromPath, request, alias) => {
  // console.log('addAlias', fromPath, request)
  if (/node_modules/.test(fromPath)) return __dirname

  return __dirname + '../../../'
})
import 'dotenv/config';
import * as koaLogger from 'koa-logger';
import * as log4js from 'log4js';
import { createApplication } from '@/common/application';
import { NODE_ENV } from '@/utils/enums';
import getLogger from '@/utils/log4js';
import errorHandle from '@/middleware/error-handle';
import { WebSocketManager } from '@/service/WebSocketManager';
import ScriptWatcher from '@/service/ScriptWatcher';
import { DeviceManager } from '@/service/DeviceManager';
import { AdminSocketManager } from '@/service/AdminSocketManager';
import { LogcatManager } from '@/service/LogcatManager';
import { SchedulerManager } from '@/service/SchedulerManager';
import { VscodeProxy } from '@/service/proxy/VscodeProxy';
import config from './config';
import * as router from './router';

const logger = getLogger('main.ts');

async function main() {
  const app = await createApplication(__dirname, Object.keys(router).map(k => router[k]), {
    logger: getLogger('app'),
  });

  if (config.env === NODE_ENV.dev) {
    app.use(koaLogger());
  }

  app.use(errorHandle());

  app.listen(config.port);

  WebSocketManager.init(app.getHttpServer());
  ScriptWatcher.init();
  DeviceManager.init();
  VscodeProxy.init();
  AdminSocketManager.init();
  LogcatManager.init();
  await SchedulerManager.init();
}

process.on('rejectionHandled', logger.error.bind(logger));
process.on('uncaughtException', logger.error.bind(logger));
process.on('warning', logger.warn.bind(logger));
process.on('exit', () => {
  log4js.shutdown();
})

main();
