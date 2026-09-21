export const QUEUE_ENRIQUECIMENTO_PEDIDOS = 'pedidos-enriquecimento';
export const QUEUE_ENRIQUECIMENTO_PEDIDOS_DLQ = 'pedidos-enriquecimento-dlq';
export const JOB_ENRIQUECER_PEDIDO = 'enriquecer-pedido';

export interface JobEnriquecerPedidoData {
  pedidoId: number;
}
