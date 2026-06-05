import { Test, TestingModule } from '@nestjs/testing';

import { applyGuardOverrides } from '../../test/testing-utils';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;

  beforeEach(async () => {
    const module: TestingModule = await applyGuardOverrides(
      Test.createTestingModule({
        controllers: [AiController],
        providers: [{ provide: AiService, useValue: {} }],
      }),
    ).compile();

    controller = module.get(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
