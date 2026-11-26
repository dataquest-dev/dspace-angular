import { first } from 'rxjs/operators';

import { SUBMISSION_LINKS_TO_FOLLOW } from '../core/submission/resolver/submission-links-to-follow';
import { WorkspaceitemDataService } from '../core/submission/workspaceitem-data.service';
import { createSuccessfulRemoteDataObject$ } from '../shared/remote-data.utils';
import { workspaceItemPageResolver } from './workspace-item-page.resolver';

describe('workspaceItemPageResolver', () => {
  describe('resolve', () => {
    let resolver: any;
    let wsiService: WorkspaceitemDataService;
    const uuid = '1234-65487-12354-1235';

    beforeEach(() => {
      wsiService = {
        findById: jasmine.createSpy('findById').and.callFake((id: string) => createSuccessfulRemoteDataObject$({ id })),
      } as any;
      resolver = workspaceItemPageResolver;
    });

    it('should resolve a workspace item with the correct id', (done) => {
      resolver({ params: { id: uuid } } as any, undefined, wsiService)
        .pipe(first())
        .subscribe(
          (resolved) => {
            expect(resolved.payload.id).toEqual(uuid);
            done();
          },
        );
    });

    it('should not resolve from a cached copy of the workspace item', (done) => {
      resolver({ params: { id: uuid } } as any, undefined, wsiService)
        .pipe(first())
        .subscribe(() => {
          expect(wsiService.findById).toHaveBeenCalledWith(uuid, false, false, ...SUBMISSION_LINKS_TO_FOLLOW);
          done();
        });
    });
  });
});
