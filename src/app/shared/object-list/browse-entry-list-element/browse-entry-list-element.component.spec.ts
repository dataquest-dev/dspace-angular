import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Params, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { TruncatePipe } from '../../utils/truncate.pipe';
import { BrowseEntryListElementComponent } from './browse-entry-list-element.component';
import { BrowseEntry } from '../../../core/shared/browse-entry.model';
import { PaginationService } from '../../../core/pagination/pagination.service';
import { RouteService } from '../../../core/services/route.service';
import { of as observableOf } from 'rxjs';

let browseEntryListElementComponent: BrowseEntryListElementComponent;
let fixture: ComponentFixture<BrowseEntryListElementComponent>;

const mockValue: BrowseEntry = Object.assign(new BrowseEntry(), {
  type: 'browseEntry',
  value: 'De Langhe Kristof'
});

const pageParam = 'bbm.page';

@Component({ template: '' })
class DummyComponent {
}

describe('BrowseEntryListElementComponent', () => {
  beforeEach(waitForAsync(() => {
    const paginationService = jasmine.createSpyObj('paginationService', {
      getPageParam: pageParam
    });
    const routeService = jasmine.createSpyObj('routeService', {
      getQueryParameterValue: observableOf(undefined)
    });

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
});

describe('BrowseEntryListElementComponent link', () => {
  // The real RouteService is used here on purpose: every parameter below reaches the component
  // through the router, the way it does in the browser, so the assertions are on what the URL
  // actually produces rather than on what a stub was told to answer.
  const scopeUUID = 'a2f2d0a1-3f0e-4d3a-9c1b-5f7e8a9b0c1d';
  let router: Router;

  const hrefFor = (queryParams: Params): string => {
    void router.navigate(['/browse/author'], { queryParams });
    tick();

    fixture = TestBed.createComponent(BrowseEntryListElementComponent);
    fixture.componentInstance.object = mockValue;
    fixture.detectChanges();

    return fixture.debugElement.query(By.css('a.lead')).nativeElement.getAttribute('href');
  };

  beforeEach(waitForAsync(() => {
    const paginationService = jasmine.createSpyObj('paginationService', {
      getPageParam: pageParam
    });

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'browse/author', component: DummyComponent }
        ])
      ],
      declarations: [BrowseEntryListElementComponent, DummyComponent, TruncatePipe],
      providers: [
        { provide: 'objectElementProvider', useValue: { mockValue } },
        {provide: PaginationService, useValue: paginationService},
        {provide: Store, useValue: jasmine.createSpyObj('store', ['dispatch'])},
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    router = TestBed.inject(Router);
  });

  it('should read its parameters through the real RouteService', () => {
    expect(TestBed.inject(RouteService) instanceof RouteService).toBeTruthy();
  });

  it('should carry over the scope and the pagination settings', fakeAsync(() => {
    const href = hrefFor({
      scope: scopeUUID,
      'bbm.rpp': '40',
      'bbm.sf': 'title',
      'bbm.sd': 'DESC'
    });

    expect(href).toContain(`scope=${scopeUUID}`);
    expect(href).toContain('bbm.rpp=40');
    expect(href).toContain('bbm.sf=title');
    expect(href).toContain('bbm.sd=DESC');
  }));

  it('should replace the current page with the page to return to', fakeAsync(() => {
    const href = hrefFor({ 'bbm.page': '3' });

    expect(href).toContain('bbm.return=3');
    expect(href).not.toContain('bbm.page=');
  }));

  it('should drop a parameter the browse page never asked for', fakeAsync(() => {
    const href = hrefFor({ scope: scopeUUID, 'amp;value': 'Some Author' });

    expect(href).toContain(`scope=${scopeUUID}`);
    expect(href).not.toContain('amp');
  }));

  it('should not pass on a scope that is present but empty', fakeAsync(() => {
    const href = hrefFor({ scope: '' });

    expect(href).not.toContain('scope=');
  }));
});
