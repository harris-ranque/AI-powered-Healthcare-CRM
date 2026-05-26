import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'http';

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const LOG_LEVEL = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');
const LOG_HTTP = parseBool(process.env.LOG_HTTP, !isTest);
const LOG_HTTP_VERBOSE = parseBool(process.env.LOG_HTTP_VERBOSE, false);
const LOG_PRETTY = parseBool(process.env.LOG_PRETTY, !isProd);

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: LOG_LEVEL,
        autoLogging: LOG_HTTP,
        transport: LOG_PRETTY
          ? {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname,req,res,responseTime,context',
                messageFormat: '{context} {msg}',
              },
            }
          : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        serializers: LOG_HTTP_VERBOSE
          ? undefined
          : {
              req: (req: IncomingMessage & { id?: string | number }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: ServerResponse) => ({
                statusCode: res.statusCode,
              }),
            },
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        customSuccessMessage: (req, res, responseTime) =>
          `${req.method ?? ''} ${req.url ?? ''} ${res.statusCode} ${responseTime}ms`,
        customErrorMessage: (req, res, err) =>
          `${req.method ?? ''} ${req.url ?? ''} ${res.statusCode} ${err.message}`,
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
