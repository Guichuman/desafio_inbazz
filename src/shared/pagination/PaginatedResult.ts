export interface PaginatedResult<T> {
  itens: T[];
  totalRegistros: number;
  numeroPagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

export const construirResultadoPaginado = <T>(
  itens: T[],
  totalRegistros: number,
  numeroPagina: number,
  tamanhoPagina: number,
): PaginatedResult<T> => ({
  itens,
  totalRegistros,
  numeroPagina,
  tamanhoPagina,
  totalPaginas: Math.max(1, Math.ceil(totalRegistros / tamanhoPagina)),
});
