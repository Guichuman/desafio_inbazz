import { Cliente } from './Cliente';
import { EnderecoEnriquecido } from './EnderecoEnriquecido';
import { PedidoSemItensError } from './errors/PedidoSemItensError';
import { ItemPedido } from './ItemPedido';
import { StatusPedido } from './value-objects/StatusPedido';

export interface PedidoProps {
  orderIdExterno: string;
  idempotencyKey: string;
  cliente: Cliente;
  itens: ItemPedido[];
  moedaOriginal: string;
  status?: StatusPedido;
}

export class Pedido {
  id!: number;
  dataInclusao!: Date;

  orderIdExterno: string;
  idempotencyKey: string;
  cliente: Cliente;
  itens: ItemPedido[];
  moedaOriginal: string;
  status: StatusPedido;

  valorTotal: number;
  valorConvertido?: number;
  moedaConvertida?: string;
  endereco?: EnderecoEnriquecido;
  tentativasEnriquecimento: number;
  motivoFalhaEnriquecimento?: string;

  private constructor(props: PedidoProps) {
    this.orderIdExterno = props.orderIdExterno;
    this.idempotencyKey = props.idempotencyKey;
    this.cliente = props.cliente;
    this.itens = props.itens;
    this.moedaOriginal = props.moedaOriginal;
    this.status = props.status ?? StatusPedido.RECEIVED;
    this.valorTotal = Pedido.calcularValorTotal(props.itens);
    this.tentativasEnriquecimento = 0;
  }

  static criar(props: PedidoProps): Pedido {
    if (!props.itens || props.itens.length === 0) {
      throw new PedidoSemItensError();
    }

    return new Pedido(props);
  }

  static restaurar(props: PedidoProps & { id: number; dataInclusao: Date }): Pedido {
    const pedido = new Pedido(props);
    pedido.id = props.id;
    pedido.dataInclusao = props.dataInclusao;
    return pedido;
  }

  private static calcularValorTotal(itens: ItemPedido[]): number {
    const total = itens.reduce((acumulado, item) => acumulado + item.calcularSubtotal(), 0);
    return Number(total.toFixed(2));
  }

  marcarEmEnriquecimento(): void {
    this.status = StatusPedido.ENRICHING;
  }

  registrarTentativaFalha(motivo: string): void {
    this.tentativasEnriquecimento += 1;
    this.motivoFalhaEnriquecimento = motivo;
  }

  concluirEnriquecimento(dados: {
    valorConvertido?: number;
    moedaConvertida?: string;
    endereco?: EnderecoEnriquecido;
  }): void {
    this.status = StatusPedido.ENRICHED;
    this.valorConvertido = dados.valorConvertido;
    this.moedaConvertida = dados.moedaConvertida;
    this.endereco = dados.endereco;
    this.motivoFalhaEnriquecimento = undefined;
  }

  falharEnriquecimentoDefinitivamente(motivo: string): void {
    this.status = StatusPedido.FAILED_ENRICHMENT;
    this.motivoFalhaEnriquecimento = motivo;
  }
}
