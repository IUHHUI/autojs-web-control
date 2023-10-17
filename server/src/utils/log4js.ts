/**
 * @Author: kun
 */
import * as path from 'path';
import * as dayjs from 'dayjs'
import { configure, getLogger, addLayout } from 'log4js';
import chalk from 'chalk';

const logger = getLogger('logger');

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
    const timeStr = dayjs(timeObj).format('YYYY-MM-DD HH:mm:ss');

    const dataStr = data.map(d => jsonable(d) ? JSON.stringify(d) : d).join(' ')
    const logStr = `${timeStr} ${padEnd(p, 5)} [${categoryName}] ${dataStr}`;

    return color ? chalk`{${clr} ${logStr}}` : logStr;
  };
});

// const LoggerLevel = 'DEBUG'
// const LoggerLevel = process.env.SERVER_LOG_LEVEL || 'INFO';
// console.log(`LoggerLevel: ${LoggerLevel}`);

const logConfigPath = path.resolve('config/log4js.json');
configure(logConfigPath);
logger.info(`Config file path -> ${logConfigPath}`);
// configure('config/log4js.json');

export default getLogger;
