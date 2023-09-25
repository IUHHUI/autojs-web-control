/**
 * @Author: kun
 */

import { configure, getLogger } from 'log4js';

// const LoggerLevel = 'DEBUG'
const LoggerLevel = process.env.SERVER_LOG_LEVEL || 'INFO';
console.log(`LoggerLevel: ${LoggerLevel}`);
const config = {
  replaceConsole: true,
  appenders: {
    stdout: { type: 'stdout' },
    access: {
      type: 'dateFile',
      filename: 'log/access.log',
      pattern: '-yyyy-MM-dd',
      category: 'http',
    },
    app: {
      type: 'file',
      filename: 'log/app.log',
      maxLogSize: 10485760,
      numBackups: 3,
    },
    errorFile: {
      type: 'file',
      filename: 'log/errors.log',
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile',
    },
  },
  categories: {
    default: { appenders: ['stdout', 'app', 'errors'], level: LoggerLevel },
    http: { appenders: ['stdout', 'access'], level: LoggerLevel },
    app: { appenders: ['stdout', 'access'], level: LoggerLevel },
  },
  pm2: true, // https://log4js-node.github.io/log4js-node/clustering.html
  pm2InstanceVar: 'INSTANCE_ID',
};

configure(config);

export default getLogger;
