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
    const currTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    return await db.table(this.$tableName).insert({ ...data,  create_time: currTime, update_time: currTime });
  }

  async updateById(id: string|number, data: T) {
    return await db.table(this.$tableName).where({ [this.$primaryKey]: id }).update(data);
  }

  async upsertBy(key: string, data: T) {
    const v = data[key];
    const table = db.table(this.$tableName)
    const exist = await table.where({ [key]: v }).findOrEmpty();

    if (exist) {
      const newData = { ...exist, ...data };
      newData.update_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

      const id = newData[this.$primaryKey];
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