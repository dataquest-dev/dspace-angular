import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  Params,
  Router,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { ProcessDataService } from '../core/data/processes/process-data.service';
import { ScriptDataService } from '../core/data/processes/script-data.service';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
import { getProcessDetailRoute } from '../process-page/process-page-routing.paths';
import { Process } from '../process-page/processes/process.model';
import { HandleService } from '../shared/handle.service';
import { NotificationsService } from '../shared/notifications/notifications.service';
import {
  createFailedRemoteDataObject$,
  createSuccessfulRemoteDataObject$,
} from '../shared/remote-data.utils';
import { ActivatedRouteStub } from '../shared/testing/active-router.stub';
import { NotificationsServiceStub } from '../shared/testing/notifications-service.stub';
import { RouterStub } from '../shared/testing/router.stub';
import { CurationFormComponent } from './curation-form.component';

describe('CurationFormComponent', () => {
  let comp: CurationFormComponent;
  let fixture: ComponentFixture<CurationFormComponent>;

  let scriptDataService: ScriptDataService;
  let processDataService: ProcessDataService;
  let configurationDataService: ConfigurationDataService;
  let handleService: HandleService;
  let notificationsService;
  let router;
  let routeStub: ActivatedRouteStub;

  const process = Object.assign(new Process(), { processId: 'process-id' });

  function recreateComponent(queryParams: Params, dsoHandle?: string): void {
    routeStub.testParams = queryParams;
    fixture = TestBed.createComponent(CurationFormComponent);
    comp = fixture.componentInstance;
    if (dsoHandle) {
      comp.dsoHandle = dsoHandle;
    }
    fixture.detectChanges();
  }

  beforeEach(waitForAsync(() => {

    scriptDataService = jasmine.createSpyObj('scriptDataService', {
      invoke: createSuccessfulRemoteDataObject$(process),
    });

    processDataService = jasmine.createSpyObj('processDataService', {
      findByHref: createSuccessfulRemoteDataObject$(process),
    });

    configurationDataService = jasmine.createSpyObj('configurationDataService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'plugin.named.org.dspace.curate.CurationTask',
        values: [
          'org.dspace.ctask.general.ProfileFormats = profileformats',
          '',
          'org.dspace.ctask.general.RequiredMetadata = requiredmetadata',
          'org.dspace.ctask.general.MetadataValueLinkChecker = checklinks',
          'value-to-be-skipped',
        ],
      })),
    });

    handleService = {
      normalizeHandle: (a: string) => of(a),
    } as any;

    notificationsService = new NotificationsServiceStub();
    router = new RouterStub();
    routeStub = new ActivatedRouteStub();

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FormsModule, ReactiveFormsModule, CurationFormComponent],
      providers: [
        { provide: ScriptDataService, useValue: scriptDataService },
        { provide: ProcessDataService, useValue: processDataService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: HandleService, useValue: handleService },
        { provide: Router, useValue: router },
        { provide: ConfigurationDataService, useValue: configurationDataService },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurationFormComponent);
    comp = fixture.componentInstance;

    fixture.detectChanges();
    spyOn(router, 'navigateByUrl').and.callThrough();
  });
  describe('init', () => {
    it('should initialise the comp and contain the different tasks', () => {
      expect(comp).toBeDefined();

      const elements = fixture.debugElement.queryAll(By.css('option'));
      expect(elements.length).toEqual(3);
      expect(elements[0].nativeElement.innerHTML).toContain('curation-task.task.profileformats.label');
      expect(elements[1].nativeElement.innerHTML).toContain('curation-task.task.requiredmetadata.label');
      expect(elements[2].nativeElement.innerHTML).toContain('curation-task.task.checklinks.label');
    });
  });
  describe('hasHandleValue', () => {
    it('should return true when a dsoHandle value was provided', () => {
      comp.dsoHandle = 'some-handle';
      fixture.detectChanges();

      expect(comp.hasHandleValue()).toBeTrue();
    });
    it('should return false when no dsoHandle value was provided', () => {
      expect(comp.hasHandleValue()).toBeFalse();
    });
  });
  describe('submit', () => {
    it('should submit the selected process and handle to the scriptservice and navigate to the corresponding process page', () => {
      comp.dsoHandle = 'test-handle';
      comp.submit();

      expect(scriptDataService.invoke).toHaveBeenCalledWith('curate', [
        { name: '-t', value: 'profileformats' },
        { name: '-i', value: 'test-handle' },
      ], []);
      expect(notificationsService.success).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith(getProcessDetailRoute('process-id'));
    });
    it('should the selected process and handle to the scriptservice and stay on the page on error', () => {
      (scriptDataService.invoke as jasmine.Spy).and.returnValue(createFailedRemoteDataObject$('Error', 500));

      comp.dsoHandle = 'test-handle';
      comp.submit();

      expect(scriptDataService.invoke).toHaveBeenCalledWith('curate', [
        { name: '-t', value: 'profileformats' },
        { name: '-i', value: 'test-handle' },
      ], []);
      expect(notificationsService.error).toHaveBeenCalled();
      expect(processDataService.findByHref).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });
  it('should use the handle provided by the form when no dsoHandle is provided', () => {
    comp.form.get('handle').patchValue('form-handle');

    comp.submit();

    expect(scriptDataService.invoke).toHaveBeenCalledWith('curate', [
      { name: '-t', value: 'profileformats' },
      { name: '-i', value: 'form-handle' },
    ], []);
  });
  it('should use "all" when the handle provided by the form is empty and when no dsoHandle is provided', () => {

    comp.submit();

    expect(scriptDataService.invoke).toHaveBeenCalledWith('curate', [
      { name: '-t', value: 'profileformats' },
      { name: '-i', value: 'all' },
    ], []);
  });

  it(`should show an error notification and return when an invalid dsoHandle is provided`, fakeAsync(() => {
    comp.dsoHandle = 'test-handle';
    spyOn(handleService, 'normalizeHandle').and.returnValue(of(null));
    comp.submit();
    flush();

    expect(notificationsService.error).toHaveBeenCalled();
    expect(scriptDataService.invoke).not.toHaveBeenCalled();
  }));

  describe('when an item_id query parameter is present', () => {
    it('should prefill the handle from the item_id query parameter', () => {
      recreateComponent({ item_id: '123456789/2' });

      expect(comp.form.get('handle').value).toEqual('123456789/2');
    });

    it('should curate the item from the item_id query parameter', () => {
      recreateComponent({ item_id: '123456789/2' });

      comp.submit();

      expect(scriptDataService.invoke).toHaveBeenCalledWith('curate', [
        { name: '-t', value: 'profileformats' },
        { name: '-i', value: '123456789/2' },
      ], []);
    });

    it('should let a dsoHandle input win over item_id', () => {
      recreateComponent({ item_id: '123456789/2' }, '123456789/9');

      expect(comp.form.get('handle').value).toEqual('');

      comp.submit();

      expect(scriptDataService.invoke).toHaveBeenCalledWith('curate', [
        { name: '-t', value: 'profileformats' },
        { name: '-i', value: '123456789/9' },
      ], []);
    });
  });
});
