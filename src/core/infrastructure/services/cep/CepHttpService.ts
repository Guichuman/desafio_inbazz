import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { EnderecoEnriquecido } from '@core/domain/pedido/EnderecoEnriquecido';
import { ICepService } from '@core/application/interfaces/ICepService';

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

@Injectable()
export class CepHttpService implements ICepService {
  private readonly logger = new Logger(CepHttpService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('CEP_API_BASE_URL', 'https://viacep.com.br/ws');
  }

  async buscarEndereco(cep: string): Promise<EnderecoEnriquecido | null> {
    const cepNormalizado = cep.replace(/\D/g, '');

    if (cepNormalizado.length !== 8) {
      this.logger.warn(`CEP invalido informado: ${cep}`);
      return null;
    }

    const { data } = await firstValueFrom(
      this.httpService.get<ViaCepResponse>(`${this.baseUrl}/${cepNormalizado}/json/`, {
        timeout: 5000,
      }),
    );

    if (data.erro) {
      return null;
    }

    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    };
  }
}
