export const IFilaPedidosService = Symbol('IFilaPedidosService');

export interface EnfileirarEnriquecimentoInput {
  pedidoId: number;
}

export interface MetricasFila {
  nomeFila: string;
  aguardando: number;
  emProcessamento: number;
  concluidos: number;
  falhados: number;
  agendados: number;
  naDlq: number;
}

export interface IFilaPedidosService {
  enfileirarEnriquecimento(input: EnfileirarEnriquecimentoInput): Promise<void>;
  obterMetricas(): Promise<MetricasFila>;
}
