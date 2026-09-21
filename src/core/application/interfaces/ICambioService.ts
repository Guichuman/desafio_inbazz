export const ICambioService = Symbol('ICambioService');

export interface ResultadoConversaoCambio {
  valorConvertido: number;
  moedaConvertida: string;
}

export interface ICambioService {
  converter(
    valor: number,
    moedaOrigem: string,
    moedaDestino: string,
  ): Promise<ResultadoConversaoCambio>;
}
