import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnderecoEnriquecido } from '@core/domain/pedido/EnderecoEnriquecido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { PedidoNaoEncontradoError } from '@core/domain/pedido/errors/PedidoNaoEncontradoError';
import { ICambioService } from '../../interfaces/ICambioService';
import { ICepService } from '../../interfaces/ICepService';
import { IPedidoRepository } from '../../interfaces/IPedidoRepository';

export interface EnriquecerPedidoOutput {
  pedido: Pedido;
}

@Injectable()
export class EnriquecerPedidoUseCase {
  private readonly logger = new Logger(EnriquecerPedidoUseCase.name);
  private readonly moedaDestino: string;

  constructor(
    @Inject(IPedidoRepository)
    private readonly pedidoRepository: IPedidoRepository,
    @Inject(ICambioService)
    private readonly cambioService: ICambioService,
    @Inject(ICepService)
    private readonly cepService: ICepService,
    configService: ConfigService,
  ) {
    this.moedaDestino = configService.get<string>('CAMBIO_MOEDA_DESTINO', 'BRL');
  }

  async executar(pedidoId: number): Promise<EnriquecerPedidoOutput> {
    const pedido = await this.pedidoRepository.buscarPorId(pedidoId);
    if (!pedido) {
      throw new PedidoNaoEncontradoError(pedidoId);
    }

    pedido.marcarEmEnriquecimento();
    await this.pedidoRepository.atualizar(pedido);

    try {
      const conversao = await this.cambioService.converter(
        pedido.valorTotal,
        pedido.moedaOriginal,
        this.moedaDestino,
      );

      const endereco = pedido.cliente.zipcode
        ? await this.tentarBuscarEndereco(pedido.cliente.zipcode)
        : undefined;

      pedido.concluirEnriquecimento({
        valorConvertido: conversao.valorConvertido,
        moedaConvertida: conversao.moedaConvertida,
        endereco: endereco ?? undefined,
      });
      await this.pedidoRepository.atualizar(pedido);

      this.logger.log(`Pedido id=${pedido.id} enriquecido com sucesso.`);
      return { pedido };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido no enriquecimento';
      pedido.registrarTentativaFalha(mensagem);
      await this.pedidoRepository.atualizar(pedido);
      throw erro;
    }
  }

  private async tentarBuscarEndereco(zipcode: string): Promise<EnderecoEnriquecido | null> {
    try {
      return await this.cepService.buscarEndereco(zipcode);
    } catch (erro) {
      this.logger.warn(
        `Falha ao consultar CEP ${zipcode}, pedido seguira sem endereco. Erro: ${erro}`,
      );
      return null;
    }
  }
}
