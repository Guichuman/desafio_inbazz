import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/domain/DomainError';

export class PaginaNaoEncontradaError extends DomainError {
  readonly codigo = 'PEDIDO003';
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(numeroPagina: number) {
    super(`Pagina ${numeroPagina} nao encontrada`);
  }
}
