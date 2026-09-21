import { StatusPedido } from '@core/domain/pedido/value-objects/StatusPedido';

const CODIGO_POR_STATUS: Record<StatusPedido, string> = {
  [StatusPedido.RECEIVED]: 'R',
  [StatusPedido.ENRICHING]: 'P',
  [StatusPedido.ENRICHED]: 'E',
  [StatusPedido.FAILED_ENRICHMENT]: 'F',
};

const STATUS_POR_CODIGO: Record<string, StatusPedido> = {
  R: StatusPedido.RECEIVED,
  P: StatusPedido.ENRICHING,
  E: StatusPedido.ENRICHED,
  F: StatusPedido.FAILED_ENRICHMENT,
};

export class StatusPedidoCodigoMapper {
  static paraCodigo(status: StatusPedido): string {
    return CODIGO_POR_STATUS[status];
  }

  static paraStatus(codigo: string): StatusPedido {
    const status = STATUS_POR_CODIGO[codigo];
    if (!status) {
      throw new Error(`Codigo de status desconhecido: ${codigo}`);
    }
    return status;
  }
}
