import { IFiltroPaginado } from '@shared/pagination/IFiltroPaginado';
import { StatusPedido } from '@core/domain/pedido/value-objects/StatusPedido';

const TAMANHO_PAGINA_PADRAO = 20;
const TAMANHO_PAGINA_MAXIMO = 100;

export interface FiltroPedidoInput {
  numeroPagina?: number;
  tamanhoPagina?: number;
  status?: StatusPedido;
}

export class FiltroPedido implements IFiltroPaginado {
  readonly numeroPagina: number;
  readonly tamanhoPagina: number;
  readonly colunaOrdenacao = 'dataInclusao';
  readonly direcaoOrdenacao = 'DESC' as const;
  readonly status?: StatusPedido;

  private constructor(input: FiltroPedidoInput) {
    this.numeroPagina = input.numeroPagina && input.numeroPagina > 0 ? input.numeroPagina : 1;
    this.tamanhoPagina =
      input.tamanhoPagina && input.tamanhoPagina > 0
        ? Math.min(input.tamanhoPagina, TAMANHO_PAGINA_MAXIMO)
        : TAMANHO_PAGINA_PADRAO;
    this.status = input.status;
  }

  static criar(input: FiltroPedidoInput): FiltroPedido {
    return new FiltroPedido(input);
  }

  get skip(): number {
    return (this.numeroPagina - 1) * this.tamanhoPagina;
  }
}
