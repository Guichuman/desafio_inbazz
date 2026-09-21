import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { extrairMensagensDeValidacao } from './extrairMensagensDeValidacao';
import { traduzirMensagemDeValidacao } from './traduzirMensagemDeValidacao';

export const criarValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new BadRequestException(extrairMensagensDeValidacao(errors).map(traduzirMensagemDeValidacao)),
  });
