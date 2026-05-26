import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { applyGuardOverrides } from '../../test/testing-utils';

describe('StorageController', () => {
  let controller: StorageController;

  beforeEach(async () => {
    const module: TestingModule = await applyGuardOverrides(
      Test.createTestingModule({
        controllers: [StorageController],
        providers: [{ provide: StorageService, useValue: {} }],
      }),
    ).compile();

    controller = module.get<StorageController>(StorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
