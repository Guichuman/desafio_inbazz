import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { CambioHttpService } from './CambioHttpService';

describe('CambioHttpService', () => {
  let service: CambioHttpService;
  let httpService: jest.Mocked<Pick<HttpService, 'get'>>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        CambioHttpService,
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'https://api.frankfurter.app' },
        },
      ],
    }).compile();

    service = app.get(CambioHttpService);
    httpService = app.get(HttpService);
  });

  it('deve retornar o mesmo valor quando a moeda de origem for igual a de destino', async () => {
    const resultado = await service.converter(100, 'BRL', 'BRL');

    expect(resultado).toEqual({ valorConvertido: 100, moedaConvertida: 'BRL' });
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('deve converter o valor usando a taxa retornada pela api', async () => {
    httpService.get.mockReturnValue(
      of({ data: { amount: 100, base: 'USD', date: '2026-01-01', rates: { BRL: 545.32 } } } as any),
    );

    const resultado = await service.converter(100, 'USD', 'BRL');

    expect(resultado).toEqual({ valorConvertido: 545.32, moedaConvertida: 'BRL' });
  });

  it('deve propagar um erro quando a chamada http falhar', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('timeout')));

    await expect(service.converter(100, 'USD', 'BRL')).rejects.toThrow(
      /Falha ao consultar servico de cambio/,
    );
  });
});
