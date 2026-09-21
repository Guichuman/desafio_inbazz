import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ReceberPedidoUseCase } from '@core/application/usecases/receber-pedido/ReceberPedidoUseCase';
import { PedidoResponseDto } from '../orders/dtos/PedidoResponseDto';
import { ReceberPedidoWebhookDto } from './dtos/ReceberPedidoWebhookDto';

@Controller('webhooks/orders')
export class OrdersWebhookController {
  constructor(private readonly receberPedidoUseCase: ReceberPedidoUseCase) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receber(@Body() dto: ReceberPedidoWebhookDto): Promise<PedidoResponseDto> {
    const resultado = await this.receberPedidoUseCase.executar({
      orderIdExterno: dto.order_id,
      idempotencyKey: dto.idempotency_key,
      cliente: {
        nome: dto.customer.name,
        email: dto.customer.email,
        zipcode: dto.customer.zipcode,
      },
      itens: dto.items.map((item) => ({
        sku: item.sku,
        quantidade: item.quantidade,
        precoUnitario: item.unit_price,
      })),
      moedaOriginal: dto.currency.toUpperCase(),
    });

    return PedidoResponseDto.fromDomain(resultado.pedido);
  }
}
