import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { paraCentavos, paraReais } from '@shared/utils/MoneyUtils';
import { ItemPedidoModel } from '../models/ItemPedidoModel';
import { PedidoModel } from '../models/PedidoModel';
import { StatusPedidoCodigoMapper } from './StatusPedidoCodigoMapper';

export class PedidoMapper {
  static paraDomain(model: PedidoModel): Pedido {
    const pedido = Pedido.restaurar({
      id: model.id,
      dataInclusao: model.dataInclusao,
      orderIdExterno: model.orderIdExterno,
      idempotencyKey: model.idempotencyKey,
      status: StatusPedidoCodigoMapper.paraStatus(model.status),
      cliente: new Cliente({
        nome: model.clienteNome,
        email: model.clienteEmail,
        zipcode: model.clienteZipcode,
      }),
      itens: (model.itens ?? []).map(
        (item) =>
          new ItemPedido({
            sku: item.sku,
            quantidade: item.quantidade,
            precoUnitario: paraReais(item.precoUnitario),
          }),
      ),
      moedaOriginal: model.moedaOriginal,
    });

    pedido.valorConvertido =
      model.valorConvertido != null ? paraReais(model.valorConvertido) : undefined;
    pedido.moedaConvertida = model.moedaConvertida;
    pedido.tentativasEnriquecimento = model.tentativasEnriquecimento;
    pedido.motivoFalhaEnriquecimento = model.motivoFalhaEnriquecimento;

    if (
      model.enderecoLogradouro ||
      model.enderecoBairro ||
      model.enderecoCidade ||
      model.enderecoUf
    ) {
      pedido.endereco = {
        logradouro: model.enderecoLogradouro,
        bairro: model.enderecoBairro,
        cidade: model.enderecoCidade,
        uf: model.enderecoUf,
      };
    }

    return pedido;
  }

  static paraModel(pedido: Pedido): PedidoModel {
    return new PedidoModel({
      id: pedido.id,
      orderIdExterno: pedido.orderIdExterno,
      idempotencyKey: pedido.idempotencyKey,
      status: StatusPedidoCodigoMapper.paraCodigo(pedido.status),
      clienteNome: pedido.cliente.nome,
      clienteEmail: pedido.cliente.email,
      clienteZipcode: pedido.cliente.zipcode,
      moedaOriginal: pedido.moedaOriginal,
      valorTotal: paraCentavos(pedido.valorTotal),
      valorConvertido:
        pedido.valorConvertido != null ? paraCentavos(pedido.valorConvertido) : undefined,
      moedaConvertida: pedido.moedaConvertida,
      enderecoLogradouro: pedido.endereco?.logradouro,
      enderecoBairro: pedido.endereco?.bairro,
      enderecoCidade: pedido.endereco?.cidade,
      enderecoUf: pedido.endereco?.uf,
      tentativasEnriquecimento: pedido.tentativasEnriquecimento,
      motivoFalhaEnriquecimento: pedido.motivoFalhaEnriquecimento,
      itens: pedido.itens.map(
        (item) =>
          new ItemPedidoModel({
            sku: item.sku,
            quantidade: item.quantidade,
            precoUnitario: paraCentavos(item.precoUnitario),
          }),
      ),
    });
  }

  static paraAtualizacaoParcial(pedido: Pedido): Partial<PedidoModel> {
    return {
      status: StatusPedidoCodigoMapper.paraCodigo(pedido.status),
      valorConvertido:
        pedido.valorConvertido != null ? paraCentavos(pedido.valorConvertido) : undefined,
      moedaConvertida: pedido.moedaConvertida,
      enderecoLogradouro: pedido.endereco?.logradouro,
      enderecoBairro: pedido.endereco?.bairro,
      enderecoCidade: pedido.endereco?.cidade,
      enderecoUf: pedido.endereco?.uf,
      tentativasEnriquecimento: pedido.tentativasEnriquecimento,
      motivoFalhaEnriquecimento: pedido.motivoFalhaEnriquecimento,
    };
  }
}
