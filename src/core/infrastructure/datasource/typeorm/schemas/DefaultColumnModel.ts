import { EntitySchemaColumnOptions } from 'typeorm';

export const DefaultColumnModel: Record<string, EntitySchemaColumnOptions> = {
  id: { type: 'int', primary: true, generated: true },
  dataInclusao: { type: 'timestamptz', name: 'data_inclusao', createDate: true },
};
