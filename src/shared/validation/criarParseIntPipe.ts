import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const VALOR_MAXIMO_INTEIRO_POSTGRES = 2147483647;

@Injectable()
class ParseIntLimitadoPipe implements PipeTransform<string, number> {
  constructor(private readonly nomeCampo: string) {}

  transform(value: string, _metadata: ArgumentMetadata): number {
    if (!/^-?\d+$/.test(value)) {
      throw new BadRequestException(`${this.nomeCampo} deve ser um número inteiro`);
    }

    const valorConvertido = parseInt(value, 10);
    if (!Number.isSafeInteger(valorConvertido) || valorConvertido > VALOR_MAXIMO_INTEIRO_POSTGRES) {
      throw new BadRequestException(
        `${this.nomeCampo} deve ser no máximo ${VALOR_MAXIMO_INTEIRO_POSTGRES}`,
      );
    }

    return valorConvertido;
  }
}

export const criarParseIntPipe = (nomeCampo: string): ParseIntLimitadoPipe =>
  new ParseIntLimitadoPipe(nomeCampo);
