import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/domain/DomainError';

export class PedidoNaoEncontradoError extends DomainError {
  readonly codigo = 'PEDIDO001';
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(identificador: string | number) {
    super(`Pedido nao encontrado: ${identificador}`);
  }
}
