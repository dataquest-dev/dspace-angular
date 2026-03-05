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
import { DSOBreadcrumbsService } from '../../../core/breadcrumbs/dso-breadcrumbs.service';
import { Breadcrumb } from '../../../breadcrumbs/breadcrumb/breadcrumb.model';
import { of as observableOf } from 'rxjs';

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
      linkService = jasmine.createSpyObj('linkService', {
        resolveLink: Object.assign(new HALResource(), {
          [object.indexableObject.getParentLinkKey()]: createSuccessfulRemoteDataObject$(parent)
        })
      });
      const breadcrumbs: Breadcrumb[] = [];
      if (expectedParentTitle) {
        breadcrumbs.push(new Breadcrumb(expectedParentTitle, ''));
      }
      breadcrumbs.push(new Breadcrumb(expectedTitle, ''));
      const dsoBreadcrumbsService = jasmine.createSpyObj('dsoBreadcrumbsService', {
        getBreadcrumbs: observableOf(breadcrumbs)
      });
      TestBed.configureTestingModule({
        declarations: [componentClass, VarDirective],
        imports: [TranslateModule.forRoot(), RouterTestingModule.withRoutes([])],
        providers: [
          { provide: TruncatableService, useValue: {} },
          { provide: LinkService, useValue: linkService },
          { provide: DSOBreadcrumbsService, useValue: dsoBreadcrumbsService },
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

/**
 * Shared test suite that verifies the hierarchical parent-path behaviour for community/collection
 * list elements: when the DSO has multiple ancestor breadcrumbs the component must join them with
 * ' / ' and must delegate to {@link DSOBreadcrumbsService#getBreadcrumbs} rather than the simple
 * parent link.
 *
 * @param componentClass  The component under test (community or collection sidebar element)
 * @param object          A {@link SearchResult} whose `indexableObject` is a Community/Collection
 * @param expectedTitle   The dc.title of the current item (last breadcrumb)
 * @param extraProviders  Any additional providers required by the component
 */
export function createHierarchicalParentTitleTests(
  componentClass: any,
  object: SearchResult<DSpaceObject & ChildHALResource>,
  expectedTitle: string,
  extraProviders: any[] = []
) {
  return () => {
    let component;
    let fixture: ComponentFixture<any>;
    let dsoBreadcrumbsService;

    // Three-level hierarchy:  Root → Parent → Current
    const rootBreadcrumb   = new Breadcrumb('Root',    '');
    const parentBreadcrumb = new Breadcrumb('Parent',  '');
    const currentBreadcrumb = new Breadcrumb(expectedTitle, '');
    const breadcrumbs = [rootBreadcrumb, parentBreadcrumb, currentBreadcrumb];

    beforeEach(waitForAsync(() => {
      const linkService = jasmine.createSpyObj('linkService', { resolveLink: {} });
      dsoBreadcrumbsService = jasmine.createSpyObj('dsoBreadcrumbsService', {
        getBreadcrumbs: observableOf(breadcrumbs)
      });

      TestBed.configureTestingModule({
        declarations: [componentClass, VarDirective],
        imports: [TranslateModule.forRoot(), RouterTestingModule.withRoutes([])],
        providers: [
          { provide: TruncatableService, useValue: {} },
          { provide: LinkService, useValue: linkService },
          { provide: DSOBreadcrumbsService, useValue: dsoBreadcrumbsService },
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

    it('should join multiple ancestor breadcrumbs with " / " as the parent title', (done) => {
      component.parentTitle$.subscribe((title) => {
        expect(title).toEqual('Root / Parent');
        done();
      });
    });

    it('should call DSOBreadcrumbsService.getBreadcrumbs to build the hierarchy path', (done) => {
      component.parentTitle$.subscribe(() => {
        expect(dsoBreadcrumbsService.getBreadcrumbs).toHaveBeenCalledWith(
          object.indexableObject,
          ''
        );
        done();
      });
    });
  };
}
