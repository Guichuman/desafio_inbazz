import { Inject, Injectable } from '@nestjs/common';
import { Pedido } from '@core/domain/pedido/Pedido';
import { PedidoNaoEncontradoError } from '@core/domain/pedido/errors/PedidoNaoEncontradoError';
import { PaginatedResult } from '@shared/pagination/PaginatedResult';
import { IPedidoRepository } from '../interfaces/IPedidoRepository';
import { FiltroPedido } from '../value-objects/FiltroPedido';

@Injectable()
export class PedidoConsultaService {
  constructor(
    @Inject(IPedidoRepository)
    private readonly pedidoRepository: IPedidoRepository,
  ) {}

  async listarPaginado(filtro: FiltroPedido): Promise<PaginatedResult<Pedido>> {
    return this.pedidoRepository.buscarPaginado(filtro);
  }

  async buscarPorId(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id);
    if (!pedido) {
      throw new PedidoNaoEncontradoError(id);
    }
    return pedido;
  }
}
