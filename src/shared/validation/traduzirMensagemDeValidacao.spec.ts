import { traduzirMensagemDeValidacao } from './traduzirMensagemDeValidacao';

describe('traduzirMensagemDeValidacao', () => {
  it('deve traduzir a mensagem de campo nao permitido (whitelist) do class-validator', () => {
    expect(traduzirMensagemDeValidacao('property campo_que_nao_existe should not exist')).toBe(
      "Campo 'campo_que_nao_existe' não é permitido",
    );
  });

  it('deve manter mensagens que ja estao em portugues inalteradas', () => {
    expect(traduzirMensagemDeValidacao('Email inválido')).toBe('Email inválido');
    expect(traduzirMensagemDeValidacao('Order id obrigatório')).toBe('Order id obrigatório');
  });
});
