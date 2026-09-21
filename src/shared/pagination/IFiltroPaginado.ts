export interface IFiltroPaginado {
  numeroPagina: number;
  tamanhoPagina: number;
  colunaOrdenacao?: string;
  direcaoOrdenacao?: 'ASC' | 'DESC';
}
