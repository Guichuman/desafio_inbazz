import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Pedido } from '@core/domain/pedido/Pedido';
import { PaginaNaoEncontradaError } from '@core/domain/pedido/errors/PaginaNaoEncontradaError';
import { PaginatedResult, construirResultadoPaginado } from '@shared/pagination/PaginatedResult';
import {
  IdempotencyKeyDuplicadaError,
  IPedidoRepository,
} from '@core/application/interfaces/IPedidoRepository';
import { FiltroPedido } from '@core/application/value-objects/FiltroPedido';
import { PedidoFindManyOptionsBuilder } from './builders/PedidoFindManyOptionsBuilder';
import { PedidoOrderBuilder } from './builders/PedidoOrderBuilder';
import { PedidoWhereBuilder } from './builders/PedidoWhereBuilder';
import { PostgresErrorCode } from './errors/PostgresErrorCode';
import { PedidoMapper } from './mappers/PedidoMapper';
import { PedidoModel } from './models/PedidoModel';
import { PedidoEntitySchema } from './schemas/PedidoEntitySchema';

interface ErroBancoDados {
  code?: string;
  constraint?: string;
}

const CONSTRAINT_IDEMPOTENCY_KEY = 'uk_tb_pedido_idempotency_key';

@Injectable()
export class PedidoRepository implements IPedidoRepository {
  constructor(
    @InjectRepository(PedidoEntitySchema)
    private readonly repository: Repository<PedidoModel>,
  ) {}

  async salvar(pedido: Pedido): Promise<Pedido> {
    try {
      const modelSalvo = await this.repository.save(PedidoMapper.paraModel(pedido));
      return PedidoMapper.paraDomain(modelSalvo);
    } catch (erro) {
      if (this.isViolacaoIdempotencyKey(erro)) {
        throw new IdempotencyKeyDuplicadaError(pedido.idempotencyKey);
      }
      throw erro;
    }
  }

  private isViolacaoIdempotencyKey(erro: unknown): boolean {
    if (!(erro instanceof QueryFailedError)) {
      return false;
    }
    const erroBancoDados = erro as unknown as ErroBancoDados;
    return (
      erroBancoDados.code === PostgresErrorCode.UNIQUE_VIOLATION &&
      erroBancoDados.constraint === CONSTRAINT_IDEMPOTENCY_KEY
    );
  }

  async atualizar(pedido: Pedido): Promise<Pedido> {
    await this.repository.update({ id: pedido.id }, PedidoMapper.paraAtualizacaoParcial(pedido));
    return pedido;
  }

  async buscarPorId(id: number): Promise<Pedido | null> {
    const model = await this.repository.findOne({ where: { id }, relations: { itens: true } });
    return model ? PedidoMapper.paraDomain(model) : null;
  }

  async buscarPorIdempotencyKey(idempotencyKey: string): Promise<Pedido | null> {
    const model = await this.repository.findOne({
      where: { idempotencyKey },
      relations: { itens: true },
    });
    return model ? PedidoMapper.paraDomain(model) : null;
  }

  async buscarPaginado(filtro: FiltroPedido): Promise<PaginatedResult<Pedido>> {
    const totalRegistros = await this.contarTotalRegistros(filtro);

    if (!totalRegistros) {
      return construirResultadoPaginado([], 0, filtro.numeroPagina, filtro.tamanhoPagina);
    }

    const findOptions = new PedidoFindManyOptionsBuilder()
      .setWhere(PedidoWhereBuilder.createFromFiltro(filtro))
      .setOrder(PedidoOrderBuilder.createFromFiltro(filtro))
      .setRelations({ itens: true })
      .setTake(filtro.tamanhoPagina)
      .setSkip(filtro.skip)
      .build();

    const models = await this.repository.find(findOptions);

    return construirResultadoPaginado(
      models.map((model) => PedidoMapper.paraDomain(model)),
      totalRegistros,
      filtro.numeroPagina,
      filtro.tamanhoPagina,
    );
  }

  private async contarTotalRegistros(filtro: FiltroPedido): Promise<number> {
    const where = PedidoWhereBuilder.createFromFiltro(filtro);
    const totalRegistros = await this.repository.count({ where });

    this.validarPaginaExiste(filtro, totalRegistros);

    return totalRegistros;
  }

  private validarPaginaExiste(filtro: FiltroPedido, totalRegistros: number): void {
    if (totalRegistros === 0) {
      return;
    }

    const totalPaginas = Math.ceil(totalRegistros / filtro.tamanhoPagina);
    if (filtro.numeroPagina > totalPaginas) {
      throw new PaginaNaoEncontradaError(filtro.numeroPagina);
    }
  }
}
