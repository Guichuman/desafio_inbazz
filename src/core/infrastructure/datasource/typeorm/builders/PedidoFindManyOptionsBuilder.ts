import { FindManyOptions, FindOptionsOrder, FindOptionsRelations, FindOptionsWhere } from 'typeorm';
import { PedidoModel } from '../models/PedidoModel';

export class PedidoFindManyOptionsBuilder {
  private options: FindManyOptions<PedidoModel> = {};

  setWhere(where: FindOptionsWhere<PedidoModel>): this {
    this.options.where = where;
    return this;
  }

  setOrder(order: FindOptionsOrder<PedidoModel>): this {
    this.options.order = order;
    return this;
  }

  setRelations(relations: FindOptionsRelations<PedidoModel>): this {
    this.options.relations = relations;
    return this;
  }

  setTake(take: number): this {
    this.options.take = take;
    return this;
  }

  setSkip(skip: number): this {
    this.options.skip = skip;
    return this;
  }

  build(): FindManyOptions<PedidoModel> {
    return this.options;
  }
}
