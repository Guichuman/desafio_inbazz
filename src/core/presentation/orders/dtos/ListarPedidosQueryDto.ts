import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { StatusPedido } from '@core/domain/pedido/value-objects/StatusPedido';

export class ListarPedidosQueryDto {
  @IsOptional()
  @IsEnum(StatusPedido, { message: 'Status inválido' })
  status?: StatusPedido;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Número da página deve ser um número inteiro' })
  @Min(1, { message: 'Número da página deve ser maior que zero' })
  numeroPagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tamanho da página deve ser um número inteiro' })
  @Min(1, { message: 'Tamanho da página deve ser maior que zero' })
  tamanhoPagina?: number;

  constructor(props?: Partial<ListarPedidosQueryDto>) {
    if (props) {
      Object.assign(this, props);
    }
  }
}
