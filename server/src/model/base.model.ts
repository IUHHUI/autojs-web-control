import db from '@/utils/db';
import * as moment from 'moment';

export default class BaseService<T> {
  $db = db;
  $tableName: string;
  $primaryKey: string;
  $tableStructure: T;

  constructor(args: { tableName: string, primaryKey?: string }) {
    this.$tableName = args.tableName;
    this.$primaryKey = args.primaryKey || `${args.tableName}_id`;
  }

  async getById(id: string | number): Promise<T> {
    return await db.table(this.$tableName).where({ [this.$primaryKey]: id }).findOrEmpty();
  }

  async getAll(): Promise<T[]> {
    return await db.table(this.$tableName).select();
  }

  async getPage(): Promise<T[]> {
    return await db.table(this.$tableName).select();
  }

  async deleteById(id: string | number) {
    return await db.table(this.$tableName).where({ [this.$primaryKey]: id }).delete();
  }

  async insert(data: T): Promise<any>;
  async insert(data: T[]): Promise<void>;
  async insert(data: T|T[]): Promise<any> {
    return await db.table(this.$tableName).insert({ ...data, create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss') });
  }

  async updateById(id: string|number, data: T) {
    return await db.table(this.$tableName).where({ [this.$primaryKey]: id }).update(data);
  }

  async upsertBy(key: string, data: T) {
    const v = data[key];
    const exist = await db.table(this.$tableName).where({ [key]: v }).findOrEmpty();

    if (exist) {
      if (exist.update_time) {
        exist.update_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      }
      if (exist.create_time) {
        exist.create_time = undefined
      }

      const id = exist[this.$primaryKey];
      const newData = { ...exist, ...data };
      await this.updateById(id, newData);

      return newData
    } else {
      const id = (await this.insert(data) || {}).insertId;
      return {
        ...data,
        [this.$primaryKey]: id
      }
    }
  }
  async upsertById(data: T) {
    return this.upsertBy(this.$primaryKey, data);
  }
}