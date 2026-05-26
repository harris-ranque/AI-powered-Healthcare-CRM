import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { applyGuardOverrides } from '../../test/testing-utils';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await applyGuardOverrides(
      Test.createTestingModule({
        controllers: [UsersController],
        providers: [{ provide: UsersService, useValue: {} }],
      }),
    ).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
