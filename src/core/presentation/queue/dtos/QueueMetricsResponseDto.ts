export class QueueMetricsResponseDto {
  nomeFila!: string;
  aguardando!: number;
  emProcessamento!: number;
  concluidos!: number;
  falhados!: number;
  agendados!: number;
  naDlq!: number;

  constructor(props: QueueMetricsResponseDto) {
    Object.assign(this, props);
  }
}
