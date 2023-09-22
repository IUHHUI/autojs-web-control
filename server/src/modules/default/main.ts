/**
 * @Author: kun
 * 2019-10-25
 */
// require('module-alias/register');
const moduleAlias = require('module-alias');
// moduleAlias.addAlias('@', __dirname + '../../')
moduleAlias.addPath(__dirname + '../../../lib')
moduleAlias.addAlias('@', (fromPath, request, alias) => {
  // fromPath - Full path of the file from which `require` was called
  // request - The path (first argument) that was passed into `require`
  // alias - The same alias that was passed as first argument to `addAlias` (`@src` in this case)

  // Return any custom target path for the `@src` alias depending on arguments
  // if (fromPath.startsWith(__dirname + '/others')) return __dirname + '/others'
  // console.log('addAlias', fromPath, request)
  if (/node_modules/.test(fromPath)) return __dirname

  return __dirname + '../../../'
})
import * as koaLogger from 'koa-logger';
import { createApplication } from '@/common/application';
import { NODE_ENV } from '@/utils/enums';
import getLogger from '@/utils/log4js';
import errorHandle from '@/middleware/error-handle';
import { WebSocketManager } from '@/service/WebSocketManager';
import { DeviceManager } from '@/service/DeviceManager';
import { AdminSocketManager } from '@/service/AdminSocketManager';
import { SchedulerManager } from '@/service/SchedulerManager';
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
  DeviceManager.init();
  AdminSocketManager.init();
  await SchedulerManager.init();
}

process.on('rejectionHandled', logger.error.bind(logger));
process.on('uncaughtException', logger.error.bind(logger));
process.on('warning', logger.warn.bind(logger));

main();
