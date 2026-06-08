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

  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),

  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().allow('').optional(),

  OPENAI_API_KEY: Joi.string().allow('').optional(),
  OPENAI_MODEL: Joi.string().allow('').optional(),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .optional(),

  LOG_HTTP: Joi.boolean().optional(),

  LOG_HTTP_VERBOSE: Joi.boolean().optional(),

  LOG_PRETTY: Joi.boolean().optional(),
});
