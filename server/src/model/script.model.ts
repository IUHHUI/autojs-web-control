import BaseModel from './base.model';

export const tableName = 'script';
export interface ITableStructure {
  [propname: string]: any
};

export class DeviceModel extends BaseModel<ITableStructure> {

  constructor() {
    super({ tableName });
  }

  getAll(query: any = {}) {
    const { noDetail } = query;
    if (noDetail) {
      return this.$db.table(this.$tableName).field('script_id', 'script_name', 'script_args', 'create_time', 'update_time').select();
    } else {
      return this.$db.table(this.$tableName).select();
    }
  }
}

export default new DeviceModel();

