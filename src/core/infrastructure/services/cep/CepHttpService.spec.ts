import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { CepHttpService } from './CepHttpService';

describe('CepHttpService', () => {
  let service: CepHttpService;
  let httpService: jest.Mocked<Pick<HttpService, 'get'>>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        CepHttpService,
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'https://viacep.com.br/ws' },
        },
      ],
    }).compile();

    service = app.get(CepHttpService);
    httpService = app.get(HttpService);
  });

  it('deve retornar null quando o cep tiver formato invalido', async () => {
    const resultado = await service.buscarEndereco('123');

    expect(resultado).toBeNull();
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('deve retornar o endereco quando a api retornar dados validos', async () => {
    httpService.get.mockReturnValue(
      of({
        data: { logradouro: 'Praca da Se', bairro: 'Se', localidade: 'Sao Paulo', uf: 'SP' },
      } as any),
    );

    const resultado = await service.buscarEndereco('01001-000');

    expect(resultado).toEqual({
      logradouro: 'Praca da Se',
      bairro: 'Se',
      cidade: 'Sao Paulo',
      uf: 'SP',
    });
  });

  it('deve retornar null quando a api indicar cep inexistente', async () => {
    httpService.get.mockReturnValue(of({ data: { erro: true } } as any));

    const resultado = await service.buscarEndereco('00000-000');

    expect(resultado).toBeNull();
  });
});
