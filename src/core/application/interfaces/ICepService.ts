import { EnderecoEnriquecido } from '@core/domain/pedido/EnderecoEnriquecido';

export const ICepService = Symbol('ICepService');

export interface ICepService {
  buscarEndereco(cep: string): Promise<EnderecoEnriquecido | null>;
}
