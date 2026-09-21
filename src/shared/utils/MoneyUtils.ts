export const paraCentavos = (valorEmReais: number): number => Math.round(valorEmReais * 100);

export const paraReais = (valorEmCentavos: number): number => valorEmCentavos / 100;
