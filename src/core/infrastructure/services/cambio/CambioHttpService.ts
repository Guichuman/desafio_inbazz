import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ICambioService,
  ResultadoConversaoCambio,
} from '@core/application/interfaces/ICambioService';

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

@Injectable()
export class CambioHttpService implements ICambioService {
  private readonly logger = new Logger(CambioHttpService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('CAMBIO_API_BASE_URL', 'https://api.frankfurter.app');
  }

  async converter(
    valor: number,
    moedaOrigem: string,
    moedaDestino: string,
  ): Promise<ResultadoConversaoCambio> {
    if (moedaOrigem === moedaDestino) {
      return { valorConvertido: valor, moedaConvertida: moedaDestino };
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<FrankfurterResponse>(`${this.baseUrl}/latest`, {
          params: { amount: valor, from: moedaOrigem, to: moedaDestino },
          timeout: 5000,
        }),
      );

      const valorConvertido = data.rates[moedaDestino];
      if (valorConvertido == null) {
        throw new Error(`Moeda de destino ${moedaDestino} nao retornada pelo servico de cambio`);
      }

      return { valorConvertido: Number(valorConvertido.toFixed(2)), moedaConvertida: moedaDestino };
    } catch (erro) {
      this.logger.error(
        `Falha ao consultar servico de cambio (${moedaOrigem} -> ${moedaDestino}): ${erro}`,
      );
      throw new Error(
        `Falha ao consultar servico de cambio: ${erro instanceof Error ? erro.message : 'erro desconhecido'}`,
      );
    }
  }
}
