/**
 * @Author: kun
 */

import { configure, getLogger, addLayout } from 'log4js';
import chalk from 'chalk';

function padEnd(str: string, len: number) {
  if (str.length < len) {
    return str + new Array(len - str.length + 1).join(' ');
  }
  return str;
}

function jsonable(o) {
  return Array.isArray(o) || Object.prototype.toString.call(o) === '[object Object]'
}

addLayout('logging', function(config) {
  const { color } = config;

  return function(logEvent) {
    const {
      startTime,
      categoryName,
      level: { levelStr: p, colour: clr },
      data,
    } = logEvent;
    const timeObj = new Date(startTime);
    const timeStr = `${timeObj
      .toLocaleDateString()
      .split('/')
      .join('-')} ${timeObj.toLocaleTimeString()}`;

    const dataStr = data.map(d => jsonable(d) ? JSON.stringify(d) : d).join(' ')
    const logStr = `${timeStr} ${padEnd(p, 5)} [${categoryName}] ${dataStr}`;

    return color ? chalk`{${clr} ${logStr}}` : logStr;
  };
});

// const LoggerLevel = 'DEBUG'
// const LoggerLevel = process.env.SERVER_LOG_LEVEL || 'INFO';

// console.log(`LoggerLevel: ${LoggerLevel}`);
// const config = {
//   replaceConsole: true,
//   appenders: {
//     stdout: { type: 'stdout' },
//     access: {
//       type: 'dateFile',
//       filename: 'log/access.log',
//       pattern: '-yyyy-MM-dd',
//       category: 'http',
//     },
//     app: {
//       type: 'file',
//       filename: 'log/app.log',
//       maxLogSize: 10485760,
//       numBackups: 3,
//     },
//     errorFile: {
//       type: 'file',
//       filename: 'log/errors.log',
//     },
//     errors: {
//       type: 'logLevelFilter',
//       level: 'ERROR',
//       appender: 'errorFile',
//     },
//   },
//   categories: {
//     default: { appenders: ['stdout', 'app', 'errors'], level: LoggerLevel },
//     http: { appenders: ['stdout', 'access'], level: LoggerLevel },
//     app: { appenders: ['stdout', 'access'], level: LoggerLevel },
//   },
//   pm2: true, // https://log4js-node.github.io/log4js-node/clustering.html
//   pm2InstanceVar: 'INSTANCE_ID',
// };

// configure(config);
configure('config/log4js.json');

export default getLogger;
