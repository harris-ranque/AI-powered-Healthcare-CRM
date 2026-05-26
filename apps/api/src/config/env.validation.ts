import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  JWT_REFRESH_SECRET: Joi.string().required(),

  STRIPE_SECRET_KEY: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),

  REDIS_PORT: Joi.number().required(),

  SENTRY_DSN: Joi.string().uri().allow('').optional(),

  API_VERSION: Joi.string().pattern(/^\d+$/).default('1'),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .optional(),

  LOG_HTTP: Joi.boolean().optional(),

  LOG_HTTP_VERBOSE: Joi.boolean().optional(),

  LOG_PRETTY: Joi.boolean().optional(),
});
