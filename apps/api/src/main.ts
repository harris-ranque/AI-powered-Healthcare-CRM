import './config/sentry';
import { Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.useLogger(app.get(Logger));

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );

  app.use(compression());

  // Allow a comma-separated list of origins so the API can serve both local
  // dev and a deployed frontend (e.g. Vercel) at the same time. Falls back to
  // FRONTEND_URL when CORS_ORIGINS is not set.
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.FRONTEND_URL ??
    ''
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const parseOriginHostname = (origin: string): string | null => {
    try {
      return new URL(origin).hostname;
    } catch {
      return null;
    }
  };

  // Localhost (any port) is always allowed so local dev works without having to
  // keep it in the allowlist alongside the deployed origin.
  const isLocalhostOrigin = (origin: string): boolean => {
    const hostname = parseOriginHostname(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  };

  // Vercel production + preview deployments (*.vercel.app).
  const isVercelOrigin = (origin: string): boolean => {
    const hostname = parseOriginHostname(origin);
    return hostname !== null && hostname.endsWith('.vercel.app');
  };

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // No Origin header (curl, server-to-server, same-origin) — allow.
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalhostOrigin(origin) ||
        isVercelOrigin(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // ngrok-skip-browser-warning lets browser fetch/XHR bypass the ngrok interstitial.
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const apiVersion = process.env.API_VERSION ?? '1';
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Healthcare SaaS API')
    .setDescription('Public API documentation')
    .setVersion(apiVersion)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');

  new NestLogger('Bootstrap').log(`Server is running on port ${port}`);
}

void bootstrap();
