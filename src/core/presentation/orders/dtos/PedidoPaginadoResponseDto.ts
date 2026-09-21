import { Pedido } from '@core/domain/pedido/Pedido';
import { PaginatedResult } from '@shared/pagination/PaginatedResult';
import { PedidoResponseDto } from './PedidoResponseDto';

export class PedidoPaginadoResponseDto {
  itens!: PedidoResponseDto[];
  totalRegistros!: number;
  numeroPagina!: number;
  tamanhoPagina!: number;
  totalPaginas!: number;

  constructor(props: PedidoPaginadoResponseDto) {
    Object.assign(this, props);
  }

  static fromDomain(resultado: PaginatedResult<Pedido>): PedidoPaginadoResponseDto {
    return new PedidoPaginadoResponseDto({
      itens: resultado.itens.map((pedido) => PedidoResponseDto.fromDomain(pedido)),
      totalRegistros: resultado.totalRegistros,
      numeroPagina: resultado.numeroPagina,
      tamanhoPagina: resultado.tamanhoPagina,
      totalPaginas: resultado.totalPaginas,
    });
  }
}
