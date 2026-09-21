import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { criarValidationPipe } from '@shared/validation/criarValidationPipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.useGlobalPipes(criarValidationPipe());

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`Aplicacao rodando em http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
