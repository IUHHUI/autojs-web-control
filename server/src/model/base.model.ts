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
    return await db.table(this.$tableName).insert(data);
  }

  async updateById(id: string|number, data: T) {
    return await db.table(this.$tableName).where({ [this.$primaryKey]: id }).update(data);
  }

  async upsertById(data: T) {
    const id = data[this.$primaryKey];
    if (id) {
      const exist = await this.getById(id);
      if (exist) {
        return this.updateById(id, data);
      }
    }

    return this.insert(data);
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
      return await this.updateById(id, {
        ...exist,
        ...data
      });
    } else {
      return await this.insert(data);
    }
  }
}