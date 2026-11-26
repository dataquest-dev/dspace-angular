import { first } from 'rxjs/operators';

import { SUBMISSION_LINKS_TO_FOLLOW } from '../core/submission/resolver/submission-links-to-follow';
import { WorkflowItemDataService } from '../core/submission/workflowitem-data.service';
import { createSuccessfulRemoteDataObject$ } from '../shared/remote-data.utils';
import { workflowItemPageResolver } from './workflow-item-page.resolver';

describe('workflowItemPageResolver', () => {
  describe('resolve', () => {
    let resolver: any;
    let wfiService: WorkflowItemDataService;
    const uuid = '1234-65487-12354-1235';

    beforeEach(() => {
      wfiService = {
        findById: jasmine.createSpy('findById').and.callFake((id: string) => createSuccessfulRemoteDataObject$({ id })),
      } as any;
      resolver = workflowItemPageResolver;
    });

    it('should resolve a workflow item with the correct id', (done) => {
      resolver({ params: { id: uuid } } as any, undefined, wfiService)
        .pipe(first())
        .subscribe(
          (resolved) => {
            expect(resolved.payload.id).toEqual(uuid);
            done();
          },
        );
    });

    it('should not resolve from a cached copy of the workflow item', (done) => {
      resolver({ params: { id: uuid } } as any, undefined, wfiService)
        .pipe(first())
        .subscribe(() => {
          expect(wfiService.findById).toHaveBeenCalledWith(uuid, false, false, ...SUBMISSION_LINKS_TO_FOLLOW);
          done();
        });
    });
  });
});
