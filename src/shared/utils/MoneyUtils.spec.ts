import { paraCentavos, paraReais } from './MoneyUtils';

describe('MoneyUtils', () => {
  describe('paraCentavos', () => {
    it('deve converter valores decimais para centavos sem erro de ponto flutuante', () => {
      expect(paraCentavos(59.9)).toBe(5990);
      expect(paraCentavos(119.8)).toBe(11980);
      expect(paraCentavos(0.1)).toBe(10);
    });

    it('deve arredondar para o centavo mais proximo', () => {
      expect(paraCentavos(10.005)).toBe(1001);
    });
  });

  describe('paraReais', () => {
    it('deve converter centavos de volta para reais', () => {
      expect(paraReais(5990)).toBe(59.9);
      expect(paraReais(11980)).toBe(119.8);
    });
  });
});
