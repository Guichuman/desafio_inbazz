import { StatusPedido } from '@core/domain/pedido/value-objects/StatusPedido';
import { StatusPedidoCodigoMapper } from './StatusPedidoCodigoMapper';

describe('StatusPedidoCodigoMapper', () => {
  it('deve converter cada status do dominio para o codigo de 1 letra persistido', () => {
    expect(StatusPedidoCodigoMapper.paraCodigo(StatusPedido.RECEIVED)).toBe('R');
    expect(StatusPedidoCodigoMapper.paraCodigo(StatusPedido.ENRICHING)).toBe('P');
    expect(StatusPedidoCodigoMapper.paraCodigo(StatusPedido.ENRICHED)).toBe('E');
    expect(StatusPedidoCodigoMapper.paraCodigo(StatusPedido.FAILED_ENRICHMENT)).toBe('F');
  });

  it('deve converter cada codigo de volta para o status do dominio', () => {
    expect(StatusPedidoCodigoMapper.paraStatus('R')).toBe(StatusPedido.RECEIVED);
    expect(StatusPedidoCodigoMapper.paraStatus('P')).toBe(StatusPedido.ENRICHING);
    expect(StatusPedidoCodigoMapper.paraStatus('E')).toBe(StatusPedido.ENRICHED);
    expect(StatusPedidoCodigoMapper.paraStatus('F')).toBe(StatusPedido.FAILED_ENRICHMENT);
  });

  it('deve lancar erro para um codigo desconhecido', () => {
    expect(() => StatusPedidoCodigoMapper.paraStatus('X')).toThrow(/Codigo de status desconhecido/);
  });
});
