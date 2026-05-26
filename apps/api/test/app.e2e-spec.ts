import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import type { HealthResponse } from '../src/modules/health/health.controller';
import { HealthModule } from '../src/modules/health/health.module';
import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';

describe('App E2E', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [PrismaModule, HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        client: {
          $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    const body = res.body as HealthResponse;
    expect(body).toMatchObject({
      status: 'ok',
      checks: { database: 'up' },
    });
  });
});
