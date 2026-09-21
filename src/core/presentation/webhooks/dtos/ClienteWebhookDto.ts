import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClienteWebhookDto {
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(64, { message: 'Email deve ter no máximo 64 caracteres' })
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Nome deve ser um texto' })
  @IsNotEmpty({ message: 'Nome obrigatório' })
  @MaxLength(64, { message: 'Nome deve ter no máximo 64 caracteres' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'CEP deve ser um texto' })
  @MaxLength(10, { message: 'CEP deve ter no máximo 10 caracteres' })
  zipcode?: string;

  constructor(props?: Partial<ClienteWebhookDto>) {
    if (props) {
      Object.assign(this, props);
    }
  }
}
