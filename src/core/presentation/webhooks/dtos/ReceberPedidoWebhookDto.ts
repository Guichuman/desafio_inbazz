import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ClienteWebhookDto } from './ClienteWebhookDto';
import { ItemPedidoWebhookDto } from './ItemPedidoWebhookDto';

export class ReceberPedidoWebhookDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Order id deve ser um texto' })
  @IsNotEmpty({ message: 'Order id obrigatório' })
  @MaxLength(100, { message: 'Order id deve ter no máximo 100 caracteres' })
  order_id!: string;

  @IsNotEmptyObject({ nullable: false }, { message: 'Dados do cliente são obrigatórios' })
  @ValidateNested()
  @Type(() => ClienteWebhookDto)
  customer!: ClienteWebhookDto;

  @IsArray({ message: 'Itens deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Pedido deve conter ao menos um item' })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoWebhookDto)
  items!: ItemPedidoWebhookDto[];

  @IsString({ message: 'Moeda deve ser um texto' })
  @Length(3, 3, { message: 'Moeda deve ter exatamente 3 caracteres' })
  currency!: string;

  @IsUUID(undefined, { message: 'Chave de idempotência deve ser um UUID válido' })
  idempotency_key!: string;

  constructor(props?: Partial<ReceberPedidoWebhookDto>) {
    if (props) {
      Object.assign(this, props);
    }
  }
}
