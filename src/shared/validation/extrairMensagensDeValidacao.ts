import { ValidationError } from 'class-validator';

export const extrairMensagensDeValidacao = (erros: ValidationError[]): string[] =>
  erros.flatMap((erro) => [
    ...(erro.constraints ? Object.values(erro.constraints) : []),
    ...(erro.children?.length ? extrairMensagensDeValidacao(erro.children) : []),
  ]);
