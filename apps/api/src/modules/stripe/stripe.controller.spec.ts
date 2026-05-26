import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import {
  applyGuardOverrides,
  mockPrismaService,
} from '../../test/testing-utils';

describe('StripeController', () => {
  let controller: StripeController;

  beforeEach(async () => {
    const module: TestingModule = await applyGuardOverrides(
      Test.createTestingModule({
        controllers: [StripeController],
        providers: [
          { provide: StripeService, useValue: {} },
          mockPrismaService,
        ],
      }),
    ).compile();

    controller = module.get<StripeController>(StripeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
