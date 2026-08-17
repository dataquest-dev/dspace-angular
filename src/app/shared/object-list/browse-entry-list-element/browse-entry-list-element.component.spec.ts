import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TruncatePipe } from '../../utils/truncate.pipe';
import { BrowseEntryListElementComponent } from './browse-entry-list-element.component';
import { BrowseEntry } from '../../../core/shared/browse-entry.model';
import { PaginationService } from '../../../core/pagination/pagination.service';
import { RouteService } from '../../../core/services/route.service';
import { of as observableOf } from 'rxjs';
import { take } from 'rxjs/operators';
let browseEntryListElementComponent: BrowseEntryListElementComponent;
let fixture: ComponentFixture<BrowseEntryListElementComponent>;

const mockValue: BrowseEntry = Object.assign(new BrowseEntry(), {
  type: 'browseEntry',
  value: 'De Langhe Kristof'
});

let paginationService;
let routeService;
const pageParam = 'bbm.page';
let queryParamsInUrl: { [name: string]: string };

function init() {
  paginationService = jasmine.createSpyObj('paginationService', {
    getPageParam: pageParam
  });

  queryParamsInUrl = { [pageParam]: '1' };
  routeService = jasmine.createSpyObj('routeService', ['getQueryParameterValue']);
  routeService.getQueryParameterValue.and.callFake(
    (name: string) => observableOf(queryParamsInUrl[name])
  );
}
describe('BrowseEntryListElementComponent', () => {
  beforeEach(waitForAsync(() => {
    init();
    TestBed.configureTestingModule({
      declarations: [BrowseEntryListElementComponent, TruncatePipe],
      providers: [
        { provide: 'objectElementProvider', useValue: { mockValue } },
        {provide: PaginationService, useValue: paginationService},
        {provide: RouteService, useValue: routeService},
      ],

      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(BrowseEntryListElementComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(BrowseEntryListElementComponent);
    browseEntryListElementComponent = fixture.componentInstance;
  }));

  describe('When the metadata is loaded', () => {
    beforeEach(() => {
      browseEntryListElementComponent.object = mockValue;
      fixture.detectChanges();
    });

    it('should show the value as a link', () => {
      const browseEntryLink = fixture.debugElement.query(By.css('a.lead'));
      expect(browseEntryLink.nativeElement.textContent.trim()).toBe(mockValue.value);
    });
  });

  describe('queryParams', () => {
    let emitted;

    const buildQueryParams = () => {
      browseEntryListElementComponent.object = mockValue;
      fixture.detectChanges();
      browseEntryListElementComponent.queryParams$.pipe(take(1)).subscribe((p) => emitted = p);
    };

    it('should keep the scope of the community or collection being browsed', () => {
      queryParamsInUrl.scope = '0eb1f4d0-fd7c-4c2c-b0d9-32ee18f5e1c1';
      buildQueryParams();

      expect(emitted.scope).toBe('0eb1f4d0-fd7c-4c2c-b0d9-32ee18f5e1c1');
    });

    it('should keep the page size and sort chosen by the user', () => {
      queryParamsInUrl['bbm.rpp'] = '40';
      queryParamsInUrl['bbm.sf'] = 'title';
      queryParamsInUrl['bbm.sd'] = 'DESC';
      buildQueryParams();

      expect(emitted['bbm.rpp']).toBe('40');
      expect(emitted['bbm.sf']).toBe('title');
      expect(emitted['bbm.sd']).toBe('DESC');
    });

    it('should drop parameters it does not recognise', () => {
      queryParamsInUrl['amp;value'] = 'Some Author';
      queryParamsInUrl.utm_source = 'newsletter';
      buildQueryParams();

      expect(Object.keys(emitted)).not.toContain('amp;value');
      expect(Object.keys(emitted)).not.toContain('utm_source');
    });
  });
});
