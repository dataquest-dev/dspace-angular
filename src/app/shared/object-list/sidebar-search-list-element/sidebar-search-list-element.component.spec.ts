import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VarDirective } from '../../utils/var.directive';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SearchResult } from '../../search/models/search-result.model';
import { DSpaceObject } from '../../../core/shared/dspace-object.model';
import { TruncatableService } from '../../truncatable/truncatable.service';
import { LinkService } from '../../../core/cache/builders/link.service';
import { createSuccessfulRemoteDataObject$ } from '../../remote-data.utils';
import { HALResource } from '../../../core/shared/hal-resource.model';
import { ChildHALResource } from '../../../core/shared/child-hal-resource.model';
import { DSONameService } from '../../../core/breadcrumbs/dso-name.service';
import { RemoteData } from '../../../core/data/remote-data';
import { RequestEntryState } from '../../../core/data/request-entry-state.model';
import { of as observableOf } from 'rxjs';
import { environment } from '../../../../environments/environment';

export function createSidebarSearchListElementTests(
  componentClass: any,
  object: SearchResult<DSpaceObject & ChildHALResource>,
  parent: DSpaceObject,
  expectedParentTitle: string,
  expectedTitle: string,
  expectedDescription: string,
  extraProviders: any[] = []
) {
  return () => {
    let component;
    let fixture: ComponentFixture<any>;

    let linkService;

    beforeEach(waitForAsync(() => {
      linkService = jasmine.createSpyObj('linkService', ['resolveLink']);
      linkService.resolveLink.and.callFake((obj: any) => {
        if (obj === object.indexableObject) {
          return Object.assign(new HALResource(), {
            [object.indexableObject.getParentLinkKey()]: createSuccessfulRemoteDataObject$(parent)
          });
        } else if (obj === parent) {
          const parentLinkKey = (parent as any).getParentLinkKey ? (parent as any).getParentLinkKey() : 'parentCommunity';
          const noContentRemoteData = observableOf(new RemoteData(
            new Date().getTime(),
            environment.cache.msToLive.default,
            new Date().getTime(),
            RequestEntryState.Success,
            undefined,
            undefined,
            204
          ));
          return Object.assign(new HALResource(), {
            [parentLinkKey]: noContentRemoteData
          });
        }
        return new HALResource();
      });
      TestBed.configureTestingModule({
        declarations: [componentClass, VarDirective],
        imports: [TranslateModule.forRoot(), RouterTestingModule.withRoutes([])],
        providers: [
          { provide: TruncatableService, useValue: {} },
          { provide: LinkService, useValue: linkService },
          DSONameService,
          ...extraProviders
        ],
        schemas: [NO_ERRORS_SCHEMA]
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
  };
}
