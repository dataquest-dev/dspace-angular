import {
  NO_ERRORS_SCHEMA,
  QueryList,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';

import { DSONameService } from '../../../core/breadcrumbs/dso-name.service';
import { LinkService } from '../../../core/cache/builders/link.service';
import { ChildHALResource } from '../../../core/shared/child-hal-resource.model';
import { DSpaceObject } from '../../../core/shared/dspace-object.model';
import { HALResource } from '../../../core/shared/hal-resource.model';
import { mockTruncatableService } from '../../mocks/mock-trucatable.service';
import { createSuccessfulRemoteDataObject$ } from '../../remote-data.utils';
import { SearchResult } from '../../search/models/search-result.model';
import { TruncatableService } from '../../truncatable/truncatable.service';
import { TruncatablePartComponent } from '../../truncatable/truncatable-part/truncatable-part.component';
import { VarDirective } from '../../utils/var.directive';

export function createSidebarSearchListElementTests(
  componentClass: any,
  object: SearchResult<DSpaceObject & ChildHALResource>,
  parent: DSpaceObject,
  expectedParentTitle: string,
  expectedTitle: string,
  expectedDescription: string,
  extraProviders: any[] = [],
) {
  return () => {
    let component;
    let fixture: ComponentFixture<any>;

    let linkService;

    beforeEach(waitForAsync(() => {
      linkService = jasmine.createSpyObj('linkService', {
        resolveLink: Object.assign(new HALResource(), {
          [object.indexableObject.getParentLinkKey()]: createSuccessfulRemoteDataObject$(parent),
        }),
      });
      TestBed.configureTestingModule({
        imports: [TranslateModule.forRoot(), RouterTestingModule.withRoutes([]), VarDirective],
        providers: [
          { provide: TruncatableService, useValue: mockTruncatableService },
          { provide: LinkService, useValue: linkService },
          DSONameService,
          ...extraProviders,
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(componentClass);
      component = fixture.componentInstance;
      component.object = object;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should contain the correct parent title', (done) => {
      component.parentTitle$.subscribe((title) => {
        expect(title).toEqual(expectedParentTitle);
        done();
      });
    });

    it('should contain the correct title', () => {
      expect(component.dsoTitle).toEqual(expectedTitle);
    });

    it('should contain the correct description', () => {
      expect(component.description).toEqual(expectedDescription);
    });

    it('should expand every truncatable part at once and not open the item itself', () => {
      const parts = [1, 2, 3].map(() => new TruncatablePartComponent(mockTruncatableService as any));
      const queryList = new QueryList<TruncatablePartComponent>();
      queryList.reset(parts);
      component.truncatableComponents = queryList;
      const event = jasmine.createSpyObj('event', ['stopPropagation']);

      component.toggleView(event, true);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.expanded).toBeTrue();
      parts.forEach((part) => expect(part.lines).toEqual('none'));
    });

    it('should collapse every truncatable part again', () => {
      const parts = [1, 2, 3].map(() => new TruncatablePartComponent(mockTruncatableService as any));
      parts.forEach((part) => part.toggleWithoutId(true));
      const queryList = new QueryList<TruncatablePartComponent>();
      queryList.reset(parts);
      component.truncatableComponents = queryList;

      component.toggleView(jasmine.createSpyObj('event', ['stopPropagation']), false);

      expect(component.expanded).toBeFalse();
      parts.forEach((part) => expect(part.lines).toEqual('1'));
    });

    it('should only offer the expand-all control once a part reports itself truncated', fakeAsync(() => {
      component.onTruncatedStateChange(1, false);
      tick();
      expect(component.expandable).toBeFalse();

      component.onTruncatedStateChange(2, true);
      tick();
      expect(component.expandable).toBeTrue();
    }));
  };
}
