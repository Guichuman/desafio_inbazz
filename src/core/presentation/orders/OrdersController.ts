import { Controller, Get, Param, Query } from '@nestjs/common';
import { PedidoConsultaService } from '@core/application/services/PedidoConsultaService';
import { FiltroPedido } from '@core/application/value-objects/FiltroPedido';
import { criarParseIntPipe } from '@shared/validation/criarParseIntPipe';
import { ListarPedidosQueryDto } from './dtos/ListarPedidosQueryDto';
import { PedidoPaginadoResponseDto } from './dtos/PedidoPaginadoResponseDto';
import { PedidoResponseDto } from './dtos/PedidoResponseDto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly pedidoConsultaService: PedidoConsultaService) {}

  @Get()
  async listar(@Query() query: ListarPedidosQueryDto): Promise<PedidoPaginadoResponseDto> {
    const filtro = FiltroPedido.criar({
      numeroPagina: query.numeroPagina,
      tamanhoPagina: query.tamanhoPagina,
      status: query.status,
    });

    const resultado = await this.pedidoConsultaService.listarPaginado(filtro);
    return PedidoPaginadoResponseDto.fromDomain(resultado);
  }

  @Get(':id')
  async buscarPorId(@Param('id', criarParseIntPipe('Id')) id: number): Promise<PedidoResponseDto> {
    const pedido = await this.pedidoConsultaService.buscarPorId(id);
    return PedidoResponseDto.fromDomain(pedido);
  }
}
