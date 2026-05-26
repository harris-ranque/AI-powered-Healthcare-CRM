import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { applyGuardOverrides } from '../../test/testing-utils';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  beforeEach(async () => {
    const module: TestingModule = await applyGuardOverrides(
      Test.createTestingModule({
        controllers: [OrganizationsController],
        providers: [{ provide: OrganizationsService, useValue: {} }],
      }),
    ).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
