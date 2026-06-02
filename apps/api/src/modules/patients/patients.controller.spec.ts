import { Test, TestingModule } from '@nestjs/testing';

import { applyGuardOverrides } from '../../test/testing-utils';

import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

describe('PatientsController', () => {
  let controller: PatientsController;

  beforeEach(async () => {
    const module: TestingModule = await applyGuardOverrides(
      Test.createTestingModule({
        controllers: [PatientsController],
        providers: [{ provide: PatientsService, useValue: {} }],
      }),
    ).compile();

    controller = module.get<PatientsController>(PatientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
