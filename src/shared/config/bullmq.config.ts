import { ConfigService } from '@nestjs/config';
import { QueueOptions } from 'bullmq';

export const bullMqConfigFactory = (configService: ConfigService): QueueOptions => ({
  connection: {
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT'),
  },
});
