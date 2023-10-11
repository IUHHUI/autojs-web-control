import getLogger from '@/utils/log4js';
import { WebSocketManager } from './WebSocketManager';

const logger = getLogger('LogcatManager');
const scriptLogger = getLogger('script');
const scriptResultLogger = getLogger('result');
// const scriptLogger = getLogger('result.script');
const ScriptLogLevels = ['DEBUG', 'VERBOSE', 'INFO', 'WARN', 'ERROR', 'FATAL'];
const LogLevelRegex = new RegExp(`\\[(${ScriptLogLevels.join('|')})\\]`);

export class LogcatManager {
  static instance: LogcatManager;

  public static getInstance() {
    if (!LogcatManager.instance) {
      logger.info('LogcatManager Not initialized!');
    }
    return LogcatManager.instance;
  }

  public log() {}

  public addListener(listener: any) {}

  public static init() {
    if (!LogcatManager.instance) {
      LogcatManager.instance = new LogcatManager();
    }

    WebSocketManager.getInstance().addDeviceLogListener(async (client, message) => {
      // console.log(client.extData && client.extData.device_id, client.name, message.type, message.data.log.length);
      if (client.type === 'device') {
        if (!message.data || !message.data.log) {
          logger.info(`client log message error -> ${client.name} -> ${JSON.stringify(message)}`);
          return;
        }

        const matches = message.data.log.match(LogLevelRegex)
        const logLevel = matches && matches[1] || 'DEBUG';
        const logData = {
          deviceId: client.extData && client.extData.device_id,
          level: logLevel,
          log: message.data.log,
        };

        switch (logLevel) {
          case 'DEBUG':
            scriptLogger.debug(logData);
            break;
          case 'VERBOSE':
            scriptLogger.trace(logData);
            break;
          case 'INFO':
            scriptLogger.info(logData);
            break;
          case 'WARN':
            scriptLogger.warn(logData);
            scriptResultLogger.warn(logData);
            break;
          case 'ERROR':
            scriptLogger.error(logData);
            scriptResultLogger.error(logData);
            break;
          default:
            break;
        }

        // 写日志文件 —— 本地log目录
        // 带缓冲的日志转储入库
      }
    });
  }
}
