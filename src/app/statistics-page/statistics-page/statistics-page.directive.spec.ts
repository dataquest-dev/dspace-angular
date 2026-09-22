import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { of } from 'rxjs';

import { getPageNotFoundRoute } from '../../app-routing-paths';
import { AuthService } from '../../core/auth/auth.service';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { RemoteData } from '../../core/data/remote-data';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { UsageReport } from '../../core/statistics/models/usage-report.model';
import { UsageReportDataService } from '../../core/statistics/usage-report-data.service';
import {
  createFailedRemoteDataObject,
  createSuccessfulRemoteDataObject,
} from '../../shared/remote-data.utils';
import { StatisticsPageDirective } from './statistics-page.directive';

const scope = Object.assign(new DSpaceObject(), { id: 'scope_id' });

const report = (id: string, points: any[]) => Object.assign(new UsageReport(), { id, points });

/**
 * The four real pages extend the directive from a @Component that only sets types, so the base is
 * built here the same way. The hasData$ branch is mirrored from statistics-page.component.html,
 * which is the only consumer of that observable.
 */
@Component({
  selector: 'ds-test-statistics-page',
  template: `
    @if ((hasData$ | async) !== true) {
      <div id="no-data">no data</div>
    }`,
  imports: [
    AsyncPipe,
  ],
})
class TestStatisticsPageComponent extends StatisticsPageDirective<DSpaceObject> {
  types: string[] = ['TotalVisits', 'TopCountries'];
}

describe('StatisticsPageDirective', () => {
  let fixture: ComponentFixture<TestStatisticsPageComponent>;
  let component: TestStatisticsPageComponent;
  let usageReportService: jasmine.SpyObj<UsageReportDataService>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  const build = (scopeData: RemoteData<DSpaceObject>, points: any[] = []) => {
    usageReportService = jasmine.createSpyObj('UsageReportDataService', ['getStatistic']);
    usageReportService.getStatistic.and.callFake(
      (id: string, type: string) => of(report(`${id}-${type}-report`, points)) as any,
    );
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    authService = jasmine.createSpyObj('AuthService', {
      isAuthenticated: of(true),
      setRedirectUrl: {},
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestStatisticsPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ scope: scopeData }) } },
        { provide: Router, useValue: router },
        { provide: UsageReportDataService, useValue: usageReportService },
        { provide: DSONameService, useValue: { getName: () => 'a scope name' } },
        { provide: AuthService, useValue: authService },
      ],
    });

    fixture = TestBed.createComponent(TestStatisticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should expose the resolved scope', () => {
    build(createSuccessfulRemoteDataObject(scope));
    let emitted: DSpaceObject;
    component.scope$.subscribe((s) => emitted = s);

    expect(emitted).toBe(scope);
  });

  it('should ask for one report per configured type, scoped to the resolved object', () => {
    build(createSuccessfulRemoteDataObject(scope));
    component.reports$.subscribe();

    expect(usageReportService.getStatistic).toHaveBeenCalledWith('scope_id', 'TotalVisits');
    expect(usageReportService.getStatistic).toHaveBeenCalledWith('scope_id', 'TopCountries');
  });

  it('should emit the reports in the order the types are declared', () => {
    build(createSuccessfulRemoteDataObject(scope));
    let emitted: UsageReport[];
    component.reports$.subscribe((reports) => emitted = reports);

    expect(emitted.map((r) => r.id))
      .toEqual(['scope_id-TotalVisits-report', 'scope_id-TopCountries-report']);
  });

  it('should report no data when every report is empty', () => {
    build(createSuccessfulRemoteDataObject(scope), []);
    let emitted: boolean;
    component.hasData$.subscribe((has) => emitted = has);

    expect(emitted).toBeFalse();
    expect(fixture.nativeElement.querySelector('#no-data')).not.toBeNull();
  });

  it('should report data when a report carries at least one point', () => {
    build(createSuccessfulRemoteDataObject(scope), [{ label: 'a', values: {} }]);
    let emitted: boolean;
    component.hasData$.subscribe((has) => emitted = has);

    expect(emitted).toBeTrue();
    expect(fixture.nativeElement.querySelector('#no-data')).toBeNull();
  });

  it('should name the scope through the DSONameService', () => {
    build(createSuccessfulRemoteDataObject(scope));

    expect(component.getName(scope)).toBe('a scope name');
  });

  it('should redirect to the not-found page instead of emitting a scope on a 404', () => {
    build(createFailedRemoteDataObject('gone', 404));
    let emitted: DSpaceObject;
    component.scope$.subscribe((s) => emitted = s);

    expect(router.navigateByUrl)
      .toHaveBeenCalledWith(getPageNotFoundRoute(), { skipLocationChange: true });
    expect(emitted).toBeUndefined();
  });
});
