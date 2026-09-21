import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('local', 'development', 'test', 'production').default('local'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  QUEUE_ENRIQUECIMENTO_MAX_ATTEMPTS: Joi.number().default(3),
  QUEUE_ENRIQUECIMENTO_BACKOFF_MS: Joi.number().default(2000),

  CAMBIO_API_BASE_URL: Joi.string().uri().required(),
  CAMBIO_MOEDA_DESTINO: Joi.string().default('BRL'),
  CEP_API_BASE_URL: Joi.string().uri().required(),
});
