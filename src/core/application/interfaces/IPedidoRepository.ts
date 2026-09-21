import { Pedido } from '@core/domain/pedido/Pedido';
import { PaginatedResult } from '@shared/pagination/PaginatedResult';
import { FiltroPedido } from '../value-objects/FiltroPedido';

export const IPedidoRepository = Symbol('IPedidoRepository');

export class IdempotencyKeyDuplicadaError extends Error {
  constructor(idempotencyKey: string) {
    super(
      `Pedido com idempotencyKey=${idempotencyKey} ja foi salvo por outra requisicao concorrente`,
    );
  }
}

export interface IPedidoRepository {
  salvar(pedido: Pedido): Promise<Pedido>;
  atualizar(pedido: Pedido): Promise<Pedido>;
  buscarPorId(id: number): Promise<Pedido | null>;
  buscarPorIdempotencyKey(idempotencyKey: string): Promise<Pedido | null>;
  buscarPaginado(filtro: FiltroPedido): Promise<PaginatedResult<Pedido>>;
}
