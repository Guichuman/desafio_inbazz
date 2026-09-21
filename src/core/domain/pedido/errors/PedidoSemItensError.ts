import { HttpStatus } from '@nestjs/common';
import { DomainError } from '@shared/domain/DomainError';

export class PedidoSemItensError extends DomainError {
  readonly codigo = 'PEDIDO002';
  readonly httpStatus = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Pedido deve conter ao menos um item');
  }
}
