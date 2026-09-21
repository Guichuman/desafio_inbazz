import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from '@shared/config/env.validation';
import { typeOrmConfigFactory } from '@shared/config/typeorm.config';
import { bullMqConfigFactory } from '@shared/config/bullmq.config';
import { PedidoModule } from './core/PedidoModule';
import { DomainExceptionFilter } from './core/presentation/filters/DomainExceptionFilter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: bullMqConfigFactory,
    }),
    PedidoModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
