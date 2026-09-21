import { ValidationError } from 'class-validator';
import { extrairMensagensDeValidacao } from './extrairMensagensDeValidacao';

describe('extrairMensagensDeValidacao', () => {
  it('deve extrair as mensagens de erros de nivel raiz', () => {
    const erros: ValidationError[] = [
      { property: 'order_id', constraints: { isNotEmpty: 'Order id obrigatório' } },
      { property: 'order_id', constraints: { isString: 'Order id deve ser um texto' } },
    ];

    expect(extrairMensagensDeValidacao(erros)).toEqual([
      'Order id obrigatório',
      'Order id deve ser um texto',
    ]);
  });

  it('deve extrair as mensagens de erros aninhados sem prefixar com o campo pai', () => {
    const erros: ValidationError[] = [
      {
        property: 'customer',
        children: [{ property: 'email', constraints: { isEmail: 'Email inválido' } }],
      },
    ];

    expect(extrairMensagensDeValidacao(erros)).toEqual(['Email inválido']);
  });

  it('deve extrair mensagens de arrays de objetos aninhados (each: true)', () => {
    const erros: ValidationError[] = [
      {
        property: 'items',
        children: [
          {
            property: '0',
            children: [{ property: 'sku', constraints: { isNotEmpty: 'SKU obrigatório' } }],
          },
        ],
      },
    ];

    expect(extrairMensagensDeValidacao(erros)).toEqual(['SKU obrigatório']);
  });
});
