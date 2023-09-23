import BaseModel from './base.model';

export const tableName = 'script';
export interface ITableStructure {
  [propname: string]: any
};

export class DeviceModel extends BaseModel<ITableStructure> {

  constructor() {
    super({ tableName });
  }

  getAll() {
    return this.$db.table(this.$tableName).field('script_id', 'script_name', 'script_args', 'create_time', 'update_time').select();
  }
}

export default new DeviceModel();

