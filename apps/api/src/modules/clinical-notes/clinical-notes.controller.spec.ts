import { Test, TestingModule } from '@nestjs/testing';

import { applyGuardOverrides } from '../../test/testing-utils';
import {
  ClinicalNotesController,
  NoteActionsController,
} from './clinical-notes.controller';
import { ClinicalNotesService } from './clinical-notes.service';

describe('ClinicalNotesController', () => {
  it('should be defined', async () => {
    const module: TestingModule = await applyGuardOverrides(
      Test.createTestingModule({
        controllers: [ClinicalNotesController, NoteActionsController],
        providers: [{ provide: ClinicalNotesService, useValue: {} }],
      }),
    ).compile();

    expect(module.get(ClinicalNotesController)).toBeDefined();
    expect(module.get(NoteActionsController)).toBeDefined();
  });
});
