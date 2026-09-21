import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { StatusPedido } from '@core/domain/pedido/value-objects/StatusPedido';
import { PedidoMapper } from './PedidoMapper';

describe('PedidoMapper', () => {
  const criarPedidoDominio = (): Pedido => {
    const pedido = Pedido.criar({
      orderIdExterno: 'ext-123',
      idempotencyKey: '11111111-1111-1111-1111-111111111111',
      cliente: new Cliente({ nome: 'Ana', email: 'ana@example.com', zipcode: '01001-000' }),
      itens: [new ItemPedido({ sku: 'ABC123', quantidade: 2, precoUnitario: 59.9 })],
      moedaOriginal: 'USD',
    });
    pedido.id = 1;
    pedido.dataInclusao = new Date('2026-01-01T10:00:00Z');
    return pedido;
  };

  it('deve converter de dominio para model preservando todos os campos', () => {
    const pedido = criarPedidoDominio();
    pedido.concluirEnriquecimento({
      valorConvertido: 650,
      moedaConvertida: 'BRL',
      endereco: { cidade: 'Sao Paulo', uf: 'SP' },
    });

    const model = PedidoMapper.paraModel(pedido);

    expect(model.orderIdExterno).toBe('ext-123');
    expect(model.idempotencyKey).toBe('11111111-1111-1111-1111-111111111111');
    expect(model.status).toBe('E');
    expect(model.valorTotal).toBe(11980);
    expect(model.valorConvertido).toBe(65000);
    expect(model.moedaConvertida).toBe('BRL');
    expect(model.enderecoCidade).toBe('Sao Paulo');
    expect(model.itens).toHaveLength(1);
    expect(model.itens[0].sku).toBe('ABC123');
    expect(model.itens[0].precoUnitario).toBe(5990);
  });

  it('deve converter de model para dominio (round-trip) preservando o estado', () => {
    const pedidoOriginal = criarPedidoDominio();
    pedidoOriginal.concluirEnriquecimento({
      valorConvertido: 650,
      moedaConvertida: 'BRL',
      endereco: { cidade: 'Sao Paulo', uf: 'SP' },
    });

    const model = PedidoMapper.paraModel(pedidoOriginal);
    model.dataInclusao = pedidoOriginal.dataInclusao;
    model.itens = model.itens.map((item, index) => ({ ...item, id: index + 1 }) as any);

    const pedidoRestaurado = PedidoMapper.paraDomain(model);

    expect(pedidoRestaurado.id).toBe(pedidoOriginal.id);
    expect(pedidoRestaurado.status).toBe(StatusPedido.ENRICHED);
    expect(pedidoRestaurado.valorConvertido).toBe(650);
    expect(pedidoRestaurado.endereco).toEqual({
      logradouro: undefined,
      bairro: undefined,
      cidade: 'Sao Paulo',
      uf: 'SP',
    });
    expect(pedidoRestaurado.itens).toHaveLength(1);
    expect(pedidoRestaurado.valorTotal).toBe(pedidoOriginal.valorTotal);
  });
});
