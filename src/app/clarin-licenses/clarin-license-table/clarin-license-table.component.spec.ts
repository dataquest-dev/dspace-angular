import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinLicenseTableComponent } from './clarin-license-table.component';
import {ClarinLicenseLabel} from '../../core/shared/clarin/clarin-license-label.model';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {createSuccessfulRemoteDataObject$} from '../../shared/remote-data.utils';
import {buildPaginatedList} from '../../core/data/paginated-list.model';
import {PageInfo} from '../../core/shared/page-info.model';
import {NotificationsServiceStub} from '../../shared/testing/notifications-service.stub';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {RequestService} from '../../core/data/request.service';
import { of as observableOf } from 'rxjs';
import {SharedModule} from '../../shared/shared.module';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {RouterTestingModule} from '@angular/router/testing';
import {PaginationService} from '../../core/pagination/pagination.service';
import {PaginationServiceStub} from '../../shared/testing/pagination-service.stub';
import {NotificationsService} from '../../shared/notifications/notifications.service';
import {defaultPagination} from '../clarin-license-table-pagination';
import {ClarinLicenseLabelDataService} from '../../core/data/clarin/clarin-license-label-data.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HostWindowService} from '../../shared/host-window.service';
import {HostWindowServiceStub} from '../../shared/testing/host-window-service.stub';
import {cloneDeep} from 'lodash';

describe('ClarinLicenseTableComponent', () => {
  let component: ClarinLicenseTableComponent;
  let fixture: ComponentFixture<ClarinLicenseTableComponent>;

  let clarinLicenseDataService: ClarinLicenseDataService;
  let clarinLicenseLabelDataService: ClarinLicenseLabelDataService;
  let requestService: RequestService;
  let notificationService: NotificationsServiceStub;
  let modalStub: NgbActiveModal;



  const mockExtendedLicenseLabel = Object.assign(new ClarinLicenseLabel(), {
    id: 1,
    label: 'exLL',
    title: 'exTTL',
    extended: true,
    icon: [new Blob(['blob string'], {
      type: 'text/plain'
    })],
    _links: {
      self: {
        href: 'url.ex.1'
      }
    }
  });

  const mockNonExtendedLicenseLabel = Object.assign(new ClarinLicenseLabel(), {
    id: 2,
    label: 'LLL',
    title: 'licenseLTTL',
    extended: false,
    icon: null,
    _links: {
      self: {
        href: 'url.ex.1'
      }
    }
  });

  const mockLicense = Object.assign(new ClarinLicense(), {
    id: 1,
    name: 'test license',
    definition: 'test definition',
    confirmation: 0,
    requiredInfo: 'test info',
    clarinLicenseLabel: mockNonExtendedLicenseLabel,
    extendedClarinLicenseLabels: [mockExtendedLicenseLabel],
    bitstreams: 0,
    _links: {
      self: {
        href: 'url.license.1'
      }
    }
  });

  const mockLicenseRD$ = createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), [mockLicense]));
  const createdLicenseRD$ = createSuccessfulRemoteDataObject$(mockLicense);
  const createdLicenseLabelRD$ = createSuccessfulRemoteDataObject$(mockExtendedLicenseLabel);
  const successfulResponse = {
    response: {
      statusCode: 200
    }};

  beforeEach(async () => {
    notificationService = new NotificationsServiceStub();
    clarinLicenseDataService = jasmine.createSpyObj('clarinLicenseService', {
      findAll: mockLicenseRD$,
      create: createdLicenseRD$,
      getLinkPath: observableOf('')
    });
    clarinLicenseLabelDataService = jasmine.createSpyObj('clarinLicenseLabelService', {
      create: createdLicenseLabelRD$
    });
    requestService = jasmine.createSpyObj('requestService', {
      send: observableOf('response'),
      getByUUID: observableOf(successfulResponse),
      generateRequestId: observableOf('123456'),
    });
    modalStub = jasmine.createSpyObj('modalService', ['close', 'open']);

    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ],
      declarations: [ ClarinLicenseTableComponent ],
      providers: [
        { provide: RequestService, useValue: requestService },
        { provide: ClarinLicenseDataService, useValue: clarinLicenseDataService },
        { provide: ClarinLicenseLabelDataService, useValue: clarinLicenseLabelDataService },
        { provide: PaginationService, useValue: new PaginationServiceStub() },
        { provide: NotificationsService, useValue: notificationService },
        { provide: NgbActiveModal, useValue: modalStub },
        { provide: HostWindowService, useValue: new HostWindowServiceStub(0) },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicenseTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize paginationOptions', () => {
    (component as ClarinLicenseTableComponent).ngOnInit();
    expect((component as ClarinLicenseTableComponent).options).toEqual(defaultPagination);
  });

  it('should onInit should initialize clarin license table data', () => {
    (component as ClarinLicenseTableComponent).ngOnInit();
    expect((component as any).clarinLicenseService.findAll).toHaveBeenCalled();
    expect((component as ClarinLicenseTableComponent).licensesRD$).not.toBeNull();
  });

  it('should create new clarin license and reload the licenses table', () => {
    (component as ClarinLicenseTableComponent).defineNewLicense(mockLicense);
    expect((component as any).clarinLicenseService.create).toHaveBeenCalled();
    // notificate successful response
    expect((component as any).notificationService.success).toHaveBeenCalled();
    // load table data
    expect((component as any).clarinLicenseService.findAll).toHaveBeenCalled();
    expect((component as ClarinLicenseTableComponent).licensesRD$).not.toBeNull();
  });

  it('should not create new clarin license label when icon image is null', () => {
    // non extended ll has no icon
    (component as ClarinLicenseTableComponent).defineLicenseLabel(mockNonExtendedLicenseLabel);
    expect((component as any).notificationService.error).toHaveBeenCalled();
  });

  it('should create new clarin license label and load table data', () => {
    // extended ll has icon
    (component as ClarinLicenseTableComponent).defineLicenseLabel(mockExtendedLicenseLabel);
    expect((component as any).clarinLicenseLabelService.create).toHaveBeenCalled();
    // notificate successful response
    expect((component as any).notificationService.success).toHaveBeenCalled();
    // load table data
    expect((component as any).clarinLicenseService.findAll).toHaveBeenCalled();
    expect((component as ClarinLicenseTableComponent).licensesRD$).not.toBeNull();
  });

  // define license label: 1. open modal, check result, call service
  // edit license: 1. open modal with values, check result, call service
  // load all licenses
});
