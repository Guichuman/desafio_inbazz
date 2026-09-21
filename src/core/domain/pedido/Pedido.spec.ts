import { Cliente } from './Cliente';
import { ItemPedido } from './ItemPedido';
import { PedidoSemItensError } from './errors/PedidoSemItensError';
import { Pedido } from './Pedido';
import { StatusPedido } from './value-objects/StatusPedido';

describe('Pedido', () => {
  const clienteValido = new Cliente({ nome: 'Ana', email: 'ana@example.com' });
  const itemValido = new ItemPedido({ sku: 'ABC123', quantidade: 2, precoUnitario: 59.9 });

  describe('criar', () => {
    it('deve criar um pedido com status RECEIVED e valor total calculado a partir dos itens', () => {
      const pedido = Pedido.criar({
        orderIdExterno: 'ext-123',
        idempotencyKey: 'uuid-1',
        cliente: clienteValido,
        itens: [itemValido],
        moedaOriginal: 'USD',
      });

      expect(pedido.status).toBe(StatusPedido.RECEIVED);
      expect(pedido.valorTotal).toBe(119.8);
      expect(pedido.tentativasEnriquecimento).toBe(0);
    });

    it('deve lancar PedidoSemItensError quando a lista de itens estiver vazia', () => {
      expect(() =>
        Pedido.criar({
          orderIdExterno: 'ext-123',
          idempotencyKey: 'uuid-1',
          cliente: clienteValido,
          itens: [],
          moedaOriginal: 'USD',
        }),
      ).toThrow(PedidoSemItensError);
    });
  });

  describe('ciclo de enriquecimento', () => {
    const criarPedidoValido = (): Pedido =>
      Pedido.criar({
        orderIdExterno: 'ext-123',
        idempotencyKey: 'uuid-1',
        cliente: clienteValido,
        itens: [itemValido],
        moedaOriginal: 'USD',
      });

    it('deve marcar o pedido como ENRICHING', () => {
      const pedido = criarPedidoValido();

      pedido.marcarEmEnriquecimento();

      expect(pedido.status).toBe(StatusPedido.ENRICHING);
    });

    it('deve concluir o enriquecimento com sucesso e limpar o motivo de falha anterior', () => {
      const pedido = criarPedidoValido();
      pedido.registrarTentativaFalha('timeout');

      pedido.concluirEnriquecimento({ valorConvertido: 600, moedaConvertida: 'BRL' });

      expect(pedido.status).toBe(StatusPedido.ENRICHED);
      expect(pedido.valorConvertido).toBe(600);
      expect(pedido.moedaConvertida).toBe('BRL');
      expect(pedido.motivoFalhaEnriquecimento).toBeUndefined();
    });

    it('deve incrementar as tentativas ao registrar uma falha', () => {
      const pedido = criarPedidoValido();

      pedido.registrarTentativaFalha('servico externo indisponivel');
      pedido.registrarTentativaFalha('servico externo indisponivel');

      expect(pedido.tentativasEnriquecimento).toBe(2);
      expect(pedido.motivoFalhaEnriquecimento).toBe('servico externo indisponivel');
    });

    it('deve marcar como FAILED_ENRICHMENT apos esgotar as tentativas', () => {
      const pedido = criarPedidoValido();

      pedido.falharEnriquecimentoDefinitivamente('DLQ: numero maximo de tentativas excedido');

      expect(pedido.status).toBe(StatusPedido.FAILED_ENRICHMENT);
      expect(pedido.motivoFalhaEnriquecimento).toBe('DLQ: numero maximo de tentativas excedido');
    });
  });
});
