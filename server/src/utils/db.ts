/**
 * @Author: kun
 */

import { DBM } from '@/src/common/dbm';
import getLogger from './log4js';

const logger = getLogger('db.ts');

const orm = new DBM({
  connectionLimit: 10,
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123',
  database: 'cloud_auto',
  isDebug: true,
});

orm.setLogger(logger as any);

export default orm;
