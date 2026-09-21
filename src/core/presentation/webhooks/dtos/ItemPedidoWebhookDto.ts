import { Expose, Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

const QUANTIDADE_MAXIMA = 1000;
const PRECO_UNITARIO_MAXIMO = 10000;

export class ItemPedidoWebhookDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'SKU deve ser um texto' })
  @IsNotEmpty({ message: 'SKU obrigatório' })
  @MaxLength(50, { message: 'SKU deve ter no máximo 50 caracteres' })
  sku!: string;

  @Expose({ name: 'qty' })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  @Max(QUANTIDADE_MAXIMA, { message: `Quantidade deve ser no máximo ${QUANTIDADE_MAXIMA}` })
  quantidade!: number;

  @IsNumber({}, { message: 'Preço unitário inválido' })
  @Min(0, { message: 'Preço unitário não pode ser negativo' })
  @Max(PRECO_UNITARIO_MAXIMO, {
    message: `Preço unitário deve ser no máximo ${PRECO_UNITARIO_MAXIMO}`,
  })
  unit_price!: number;

  constructor(props?: Partial<ItemPedidoWebhookDto>) {
    if (props) {
      Object.assign(this, props);
    }
  }
}
