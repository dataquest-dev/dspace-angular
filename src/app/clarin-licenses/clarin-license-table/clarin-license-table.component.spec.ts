import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClarinLicenseTableComponent } from './clarin-license-table.component';
import { NotificationsServiceStub } from '../../shared/testing/notifications-service.stub';
import { ClarinLicenseDataService } from '../../core/data/clarin/clarin-license-data.service';
import { RequestService } from '../../core/data/request.service';
import { EventEmitter } from '@angular/core';
import { of as observableOf, throwError } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { PaginationService } from '../../core/pagination/pagination.service';
import { PaginationServiceStub } from '../../shared/testing/pagination-service.stub';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { defaultPagination } from '../clarin-license-table-pagination';
import { ClarinLicenseLabelDataService } from '../../core/data/clarin/clarin-license-label-data.service';
import { NgbActiveModal, NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { HostWindowService } from '../../shared/host-window.service';
import { HostWindowServiceStub } from '../../shared/testing/host-window-service.stub';
import {
  createdLicenseLabelRD$,
  createdLicenseRD$,
  mockExtendedLicenseLabel,
  mockLicenseLabelListRD$,
  mockLicense, mockLicenseRD$,
  mockNonExtendedLicenseLabel, successfulResponse
} from '../../shared/testing/clarin-license-mock';
import {GroupDataService} from '../../core/eperson/group-data.service';
import {createSuccessfulRemoteDataObject, createSuccessfulRemoteDataObject$} from '../../shared/remote-data.utils';
import { createFailedRemoteDataObject$, createNoContentRemoteDataObject$ } from '../../shared/remote-data.utils';
import { createFailedRemoteDataObject } from '../../shared/remote-data.utils';
import {createPaginatedList} from '../../shared/testing/utils.test';
import {LinkHeadService} from '../../core/services/link-head.service';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import {ConfigurationProperty} from '../../core/shared/configuration-property.model';
import {SearchConfigurationService} from '../../core/shared/search/search-configuration.service';
import { DefineLicenseLabelFormComponent } from './modal/define-license-label-form/define-license-label-form.component';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { ClarinLicenseLabel } from '../../core/shared/clarin/clarin-license-label.model';
import { ClarinLicense } from '../../core/shared/clarin/clarin-license.model';
import { buildPaginatedList } from '../../core/data/paginated-list.model';
import { PageInfo } from '../../core/shared/page-info.model';

describe('ClarinLicenseTableComponent', () => {
  let component: ClarinLicenseTableComponent;
  let fixture: ComponentFixture<ClarinLicenseTableComponent>;

  let clarinLicenseDataService: ClarinLicenseDataService;
  let clarinLicenseLabelDataService: ClarinLicenseLabelDataService;
  let requestService: RequestService;
  let notificationService: NotificationsServiceStub;
  let activeModalStub: NgbActiveModal;
  let modalServiceStub: jasmine.SpyObj<NgbModal>;
  let groupsDataService: GroupDataService;
  let service: ConfigurationDataService;
  let searchConfigurationServiceStub: SearchConfigurationService;
  let labelEditModalRef: any;
  let labelDeleteModalRef: any;
  let paginationServiceStub: PaginationServiceStub;

  beforeEach(async () => {
    notificationService = new NotificationsServiceStub();
    clarinLicenseDataService = jasmine.createSpyObj('clarinLicenseService', {
      findAll: mockLicenseRD$,
      create: createdLicenseRD$,
      put: createdLicenseRD$,
      delete: createNoContentRemoteDataObject$(),
      searchBy: mockLicenseRD$,
      getLinkPath: observableOf('')
    });
    clarinLicenseLabelDataService = jasmine.createSpyObj('clarinLicenseLabelService', {
      create: createdLicenseLabelRD$,
      findAll: mockLicenseLabelListRD$,
      put: createdLicenseLabelRD$,
      delete: observableOf({ hasSucceeded: true })
    });
    requestService = jasmine.createSpyObj('requestService', {
      send: observableOf('response'),
      getByUUID: observableOf(successfulResponse),
      generateRequestId: observableOf('123456'),
    });
    activeModalStub = jasmine.createSpyObj('activeModal', ['close', 'open']);
    modalServiceStub = jasmine.createSpyObj('modalService', ['open']);
    labelEditModalRef = {
      componentInstance: {},
      result: Promise.resolve(null)
    };
    labelDeleteModalRef = {
      componentInstance: {
        response: new EventEmitter<boolean>()
      }
    };
    modalServiceStub.open.and.callFake((modalComponent) => {
      if (modalComponent === DefineLicenseLabelFormComponent) {
        return labelEditModalRef;
      }
      if (modalComponent === ConfirmationModalComponent) {
        return labelDeleteModalRef;
      }
      return { componentInstance: {}, result: Promise.resolve(null) } as any;
    });
    groupsDataService = jasmine.createSpyObj('groupsDataService', {
      findListByHref: createSuccessfulRemoteDataObject$(createPaginatedList([])),
      getGroupRegistryRouterLink: ''
    });
    const linkHeadService = jasmine.createSpyObj('linkHeadService', {
      addTag: {},
      removeTag: {}
    });
    const configurationDataService = jasmine.createSpyObj('configurationDataService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'test',
        values: [
          'org.dspace.ctask.general.ProfileFormats = test'
        ]
      }))
    });
    searchConfigurationServiceStub = jasmine.createSpyObj('SearchConfigurationService', {
      getCurrentConfiguration: observableOf('default'),
      getCurrentScope: observableOf('test-id'),
      updateFixedFilter: jasmine.createSpy('updateFixedFilter'),
      setPaginationId: jasmine.createSpy('setPaginationId')
    });
    paginationServiceStub = new PaginationServiceStub();

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
        { provide: PaginationService, useValue: paginationServiceStub },
        { provide: NotificationsService, useValue: notificationService },
        { provide: NgbActiveModal, useValue: activeModalStub },
        { provide: NgbModal, useValue: modalServiceStub },
        { provide: HostWindowService, useValue: new HostWindowServiceStub(0) },
        { provide: GroupDataService, useValue: groupsDataService },
        { provide: LinkHeadService, useValue: linkHeadService },
        { provide: ConfigurationDataService, useValue: configurationDataService },
        { provide: SearchConfigurationService, useValue: searchConfigurationServiceStub },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicenseTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component = null;
    clarinLicenseLabelDataService = null;
    fixture.destroy();
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
    expect((component as any).clarinLicenseService.searchBy).toHaveBeenCalled();
    expect((component as ClarinLicenseTableComponent).licensesRD$).not.toBeNull();
  });

  it('should create new clarin license and reload the licenses table', () => {
    (component as ClarinLicenseTableComponent).defineNewLicense(mockLicense);
    expect((component as any).clarinLicenseService.create).toHaveBeenCalled();
    // notificate successful response
    expect((component as any).notificationService.success).toHaveBeenCalled();
    // load table data
    expect((component as any).clarinLicenseService.searchBy).toHaveBeenCalled();
    expect((component as ClarinLicenseTableComponent).licensesRD$).not.toBeNull();
  });

  it('should create new clarin license label when icon image is null', () => {
    // non extended ll has no icon
    (component as ClarinLicenseTableComponent).defineLicenseLabel(mockNonExtendedLicenseLabel);
    expect((component as any).notificationService.success).toHaveBeenCalled();
  });

  it('should create new clarin license label and load table data', fakeAsync(() => {
    // extended ll has icon
    (component as ClarinLicenseTableComponent).defineLicenseLabel(mockExtendedLicenseLabel);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect((component as any).clarinLicenseLabelService.create).toHaveBeenCalled();
      // notificate successful response
      expect((component as any).notificationService.success).toHaveBeenCalled();
      // load table data
      expect((component as any).clarinLicenseService.searchBy).toHaveBeenCalled();
      expect((component as ClarinLicenseTableComponent).licensesRD$).not.toBeNull();
    });
  }));

  it('should successful edit clarin license', () => {
    // some license must be selected
    (component as ClarinLicenseTableComponent).selectedLicense = mockLicense;
    // non extended ll has no icon
    (component as ClarinLicenseTableComponent).editLicense(mockLicense);
    expect((component as any).clarinLicenseService.put).toHaveBeenCalled();
    // notificate successful response
    expect((component as any).notificationService.success).toHaveBeenCalled();
    // load table data
    expect((component as any).clarinLicenseService.searchBy).toHaveBeenCalled();
    expect((component as ClarinLicenseTableComponent).licensesRD$).not.toBeNull();
  });

  describe('license delete button', () => {
    const getDeleteControls = () => {
      const actionsRow = fixture.debugElement.query(By.css('.mt-2'));
      const deleteWrapper = actionsRow.query(By.css('.btn-group.pr-1:last-child span'));
      const deleteButton = deleteWrapper.query(By.css('button.btn-danger'));
      return { deleteWrapper, deleteButton };
    };

    beforeEach(() => {
      (clarinLicenseDataService.delete as jasmine.Spy).calls.reset();
    });

    it('should disable delete button and expose tooltip when selected license has bitstreams', () => {
      component.selectedLicense = Object.assign({}, mockLicense, { bitstreams: 2 });
      fixture.detectChanges();

      const { deleteWrapper, deleteButton } = getDeleteControls();
      const deleteTooltip = deleteWrapper.injector.get(NgbTooltip);

      expect(deleteButton.attributes['aria-disabled']).toBe('true');
      expect(deleteButton.nativeElement.classList.contains('disabled')).toBeTrue();
      expect((deleteWrapper.nativeElement as HTMLElement).getAttribute('tabindex')).toBe('0');
      expect(deleteTooltip.ngbTooltip as string).toContain('clarin-license.button.delete-l');
    });

    it('should not call delete when clicking disabled delete button', () => {
      component.selectedLicense = Object.assign({}, mockLicense, { bitstreams: 1 });
      fixture.detectChanges();

      const { deleteButton } = getDeleteControls();
      deleteButton.nativeElement.click();

      expect((clarinLicenseDataService.delete as jasmine.Spy)).not.toHaveBeenCalled();
    });

    it('should enable delete button and call delete when selected license has no bitstreams', () => {
      component.selectedLicense = Object.assign({}, mockLicense, { bitstreams: 0 });
      fixture.detectChanges();

      const { deleteWrapper, deleteButton } = getDeleteControls();
      deleteButton.nativeElement.click();

      expect(deleteButton.attributes['aria-disabled']).toBe('false');
      expect(deleteButton.nativeElement.classList.contains('disabled')).toBeFalse();
      expect((deleteWrapper.nativeElement as HTMLElement).getAttribute('tabindex')).toBeNull();
      expect((clarinLicenseDataService.delete as jasmine.Spy)).toHaveBeenCalledWith(String(mockLicense.id));
    });
  });

  describe('label edit flow', () => {
    beforeEach(() => {
      notificationService.success.calls.reset();
      notificationService.error.calls.reset();
      (clarinLicenseLabelDataService.put as jasmine.Spy).calls.reset();
    });

    it('should open edit modal with the selected label when editLabel is called', () => {
      component.editLabel(mockExtendedLicenseLabel);

      expect(modalServiceStub.open).toHaveBeenCalledWith(DefineLicenseLabelFormComponent, { centered: true });
      expect(labelEditModalRef.componentInstance.clarinLicenseLabel).toBe(mockExtendedLicenseLabel);
    });

    it('should call clarinLicenseLabelService.put with updated label on modal submit', fakeAsync(() => {
      const refreshSpy = spyOn(component, 'refreshLabels').and.stub();
      const reloadLicensesSpy = spyOn(component, 'loadAllLicenses').and.stub();
      labelEditModalRef.result = Promise.resolve({
        label: 'EDIT',
        title: 'Edited title',
        extended: false
      });

      component.editLabel(mockExtendedLicenseLabel);
      tick();

      expect((clarinLicenseLabelDataService.put as jasmine.Spy)).toHaveBeenCalled();
      const putArgument = (clarinLicenseLabelDataService.put as jasmine.Spy).calls.mostRecent().args[0];
      expect(putArgument.id).toBe(mockExtendedLicenseLabel.id);
      expect(putArgument._links).toEqual(mockExtendedLicenseLabel._links);
      expect(putArgument.label).toBe('EDIT');
      expect(putArgument.title).toBe('Edited title');
      expect(putArgument.extended).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
      expect(reloadLicensesSpy).toHaveBeenCalled();
    }));

    it('should clear the icon when clearIcon is set and no new file is selected', fakeAsync(() => {
      spyOn(component, 'refreshLabels').and.stub();
      spyOn(component, 'loadAllLicenses').and.stub();
      const labelWithIcon = Object.assign(new ClarinLicenseLabel(), {
        ...mockExtendedLicenseLabel,
        icon: [1, 2, 3]
      });

      component.editLicenseLabel({
        label: 'CLR',
        title: 'Cleared icon',
        extended: false,
        clearIcon: true
      }, labelWithIcon);
      tick();

      const putArgument = (clarinLicenseLabelDataService.put as jasmine.Spy).calls.mostRecent().args[0];
      expect(putArgument.icon).toEqual([]);
      expect(notificationService.success).toHaveBeenCalled();
    }));

    it('should keep the existing icon when clearIcon is not set and no new file is selected', fakeAsync(() => {
      spyOn(component, 'refreshLabels').and.stub();
      spyOn(component, 'loadAllLicenses').and.stub();
      const labelWithIcon = Object.assign(new ClarinLicenseLabel(), {
        ...mockExtendedLicenseLabel,
        icon: [1, 2, 3]
      });

      component.editLicenseLabel({
        label: 'KEP',
        title: 'Kept icon',
        extended: false,
        clearIcon: false
      }, labelWithIcon);
      tick();

      const putArgument = (clarinLicenseLabelDataService.put as jasmine.Spy).calls.mostRecent().args[0];
      expect(putArgument.icon).toBeUndefined();
    }));

    it('should show error notification on failed edit', fakeAsync(() => {
      spyOn(component, 'refreshLabels').and.stub();
      (clarinLicenseLabelDataService.put as jasmine.Spy).and.returnValue(createFailedRemoteDataObject$('put failed', 500));

      component.editLicenseLabel({
        label: 'ERR',
        title: 'Failed title',
        extended: true
      }, mockExtendedLicenseLabel);
      tick();

      expect(notificationService.error).toHaveBeenCalled();
    }));
  });

  describe('label create pagination', () => {
    it('should jump to the last labels page after a successful create so the new label is visible', () => {
      paginationServiceStub.updateRoute.calls.reset();
      const refreshSpy = spyOn(component, 'refreshLabels').and.stub();
      // 25 existing labels, page size 10 -> after adding one (26) the new label is on page 3.
      (component as any).labelsRD$.next(
        createSuccessfulRemoteDataObject(buildPaginatedList(
          Object.assign(new PageInfo(), { totalElements: 25, elementsPerPage: 10 }), []))
      );

      component.createClarinLicenseLabel(mockNonExtendedLicenseLabel, [], 'ok', 'err');

      expect(paginationServiceStub.updateRoute).toHaveBeenCalledWith(
        (component as any).labelPaginationOptions.id, { page: 3 });
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('label delete flow', () => {
    beforeEach(() => {
      notificationService.success.calls.reset();
      notificationService.error.calls.reset();
      (clarinLicenseLabelDataService.delete as jasmine.Spy).calls.reset();
      labelDeleteModalRef.componentInstance.response = new EventEmitter<boolean>();
    });

    it('should open confirmation modal when confirmDeleteLabel is called', () => {
      component.confirmDeleteLabel(mockNonExtendedLicenseLabel);

      expect(modalServiceStub.open).toHaveBeenCalledWith(ConfirmationModalComponent, { centered: true });
      expect(labelDeleteModalRef.componentInstance.headerLabel).toBe('clarin.license.label.delete.confirm.title');
      expect(labelDeleteModalRef.componentInstance.infoLabel).toBe('clarin.license.label.delete.confirm.message');
      expect(labelDeleteModalRef.componentInstance.dso.name).toBe(mockNonExtendedLicenseLabel.label);
    });

    it('should call clarinLicenseLabelService.delete with correct id on confirmation', fakeAsync(() => {
      const refreshSpy = spyOn(component, 'refreshLabels').and.stub();
      const reloadLicensesSpy = spyOn(component, 'loadAllLicenses').and.stub();
      (clarinLicenseLabelDataService.delete as jasmine.Spy).and.returnValue(createNoContentRemoteDataObject$());

      component.confirmDeleteLabel(mockNonExtendedLicenseLabel);
      labelDeleteModalRef.componentInstance.response.emit(true);
      tick();

      expect((clarinLicenseLabelDataService.delete as jasmine.Spy)).toHaveBeenCalledWith(String(mockNonExtendedLicenseLabel.id));
      expect(notificationService.success).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
      expect(reloadLicensesSpy).toHaveBeenCalled();
    }));

    it('should show error notification on failed delete', () => {
      spyOn(component, 'refreshLabels').and.stub();
      (clarinLicenseLabelDataService.delete as jasmine.Spy).and.returnValue(throwError(() => new Error('delete failed')));

      component.confirmDeleteLabel(mockNonExtendedLicenseLabel);
      labelDeleteModalRef.componentInstance.response.emit(true);

      expect(notificationService.error).toHaveBeenCalled();
    });

    it('should not call delete service when confirmation is cancelled', () => {
      component.confirmDeleteLabel(mockNonExtendedLicenseLabel);
      labelDeleteModalRef.componentInstance.response.emit(false);

      expect((clarinLicenseLabelDataService.delete as jasmine.Spy)).not.toHaveBeenCalled();
    });
  });

  describe('label row actions', () => {
    const linkedLabel = Object.assign(new ClarinLicenseLabel(), {
      id: 200,
      label: 'LNKD',
      title: 'Linked',
      extended: false,
      icon: null,
      _links: {
        self: {
          href: 'url.linked'
        }
      }
    });

    const unlinkedLabel = Object.assign(new ClarinLicenseLabel(), {
      id: 201,
      label: 'UNLK',
      title: 'Unlinked',
      extended: false,
      icon: null,
      _links: {
        self: {
          href: 'url.unlinked'
        }
      }
    });

    const linkedLicense = Object.assign(new ClarinLicense(), {
      ...mockLicense,
      clarinLicenseLabel: linkedLabel,
      extendedClarinLicenseLabels: []
    });

    beforeEach(() => {
      (component as any).labelsRD$.next(
        createSuccessfulRemoteDataObject(buildPaginatedList(new PageInfo(), [linkedLabel, unlinkedLabel]))
      );
      (component as any).inUseLabelIds = new Set<string>([String(linkedLicense.clarinLicenseLabel.id)]);
      (component as any).labelUsageReady$.next(true);
      fixture.detectChanges();
    });

    it('should disable delete on all rows until the usage crawl has finished', () => {
      (component as any).labelUsageReady$.next(false);
      fixture.detectChanges();

      const labelRows = fixture.debugElement.queryAll(By.css('.labels-section tbody tr'));
      const deleteButtons = labelRows.map((row) => row.queryAll(By.css('button'))[1]);

      deleteButtons.forEach((deleteButton) => {
        expect(deleteButton.attributes['aria-disabled']).toBe('true');
        expect(deleteButton.nativeElement.classList.contains('disabled')).toBeTrue();
      });
    });

    it('should disable delete button and expose tooltip for linked labels', () => {
      fixture.detectChanges();

      const labelRows = fixture.debugElement.queryAll(By.css('.labels-section tbody tr'));
      const linkedRowDeleteWrapper = labelRows[0].query(By.css('td:last-child span'));
      const linkedRowButtons = labelRows[0].queryAll(By.css('button'));
      const linkedDeleteButton = linkedRowButtons[1];

      expect(linkedRowButtons.length).toBe(2);
      expect(linkedDeleteButton.attributes['aria-disabled']).toBe('true');
      expect(linkedDeleteButton.nativeElement.classList.contains('disabled')).toBeTrue();
      expect((linkedRowDeleteWrapper.nativeElement as HTMLElement).getAttribute('tabindex')).toBe('0');
      expect((linkedRowDeleteWrapper.nativeElement as HTMLElement).getAttribute('ng-reflect-ngb-tooltip')).toContain('clarin.license.label.table.del');
    });

    it('should not open confirmation modal when clicking disabled delete on linked label', () => {
      const labelRows = fixture.debugElement.queryAll(By.css('.labels-section tbody tr'));
      const linkedDeleteButton = labelRows[0].queryAll(By.css('button'))[1];

      modalServiceStub.open.calls.reset();
      (clarinLicenseLabelDataService.delete as jasmine.Spy).calls.reset();

      linkedDeleteButton.nativeElement.click();
      fixture.detectChanges();

      expect(modalServiceStub.open).not.toHaveBeenCalledWith(ConfirmationModalComponent);
      expect((clarinLicenseLabelDataService.delete as jasmine.Spy)).not.toHaveBeenCalled();
    });

    it('should keep delete button enabled for unlinked labels', () => {
      const labelRows = fixture.debugElement.queryAll(By.css('.labels-section tbody tr'));
      const unlinkedRowDeleteWrapper = labelRows[1].query(By.css('td:last-child span'));
      const unlinkedRowDeleteButton = labelRows[1].queryAll(By.css('button'))[1];

      expect(unlinkedRowDeleteButton.attributes['aria-disabled']).toBe('false');
      expect(unlinkedRowDeleteButton.nativeElement.classList.contains('disabled')).toBeFalse();
      expect((unlinkedRowDeleteWrapper.nativeElement as HTMLElement).getAttribute('tabindex')).toBeNull();
    });
  });

  it('should not show labels empty-state row when labels request failed', () => {
    (component as any).loading$.next(false);
    (component as any).labelsRD$.next(createFailedRemoteDataObject('labels load failed', 500));
    fixture.detectChanges();

    const emptyStateRow = fixture.debugElement.queryAll(By.css('.labels-section tbody tr'))
      .find((row) => row.nativeElement.textContent.includes('clarin.license.label.table.empty'));

    expect(emptyStateRow).toBeUndefined();
  });

  describe('license usage loading performance', () => {
    it('should load full usage dataset only once across repeated table reloads', () => {
      (component as any).labelUsageReady$.next(false);
      (component as any).licenseUsageLoading = false;

      const usageSpy = spyOn<any>(component, 'loadAllLicensesForUsage').and.callFake(() => {
        (component as any).licenseUsageLoading = false;
        (component as any).labelUsageReady$.next(true);
      });

      component.loadAllLicenses();
      component.loadAllLicenses();

      expect(usageSpy).toHaveBeenCalledTimes(1);
    });

    it('should force usage dataset reload when explicitly requested', () => {
      (component as any).labelUsageReady$.next(false);
      (component as any).licenseUsageLoading = false;

      const usageSpy = spyOn<any>(component, 'loadAllLicensesForUsage').and.callFake(() => {
        (component as any).licenseUsageLoading = false;
        (component as any).labelUsageReady$.next(true);
      });

      component.loadAllLicenses();
      component.loadAllLicenses({ forceUsageReload: true });

      expect(usageSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('should reset pagination to page 1 when the search term changes', () => {
    paginationServiceStub.pagination.id = defaultPagination.id;
    paginationServiceStub.pagination.currentPage = 2;
    paginationServiceStub.pagination.pageSize = 10;
    paginationServiceStub.pagination.pageSizeOptions = defaultPagination.pageSizeOptions;
    (component as any).clarinLicenseService.searchBy.calls.reset();
    paginationServiceStub.resetPage.calls.reset();

    component.searchingLicenseName = 'Universal';

    component.searchLicenses();

    expect(paginationServiceStub.resetPage).toHaveBeenCalledWith(defaultPagination.id);
    expect((component as any).clarinLicenseService.searchBy).toHaveBeenCalledWith(
      'byNameLike',
      jasmine.objectContaining({
        currentPage: 1,
        elementsPerPage: 10,
      }),
      false
    );
  });

  it('should not reset pagination when searching with the same term', () => {
    paginationServiceStub.pagination.id = defaultPagination.id;
    paginationServiceStub.pagination.currentPage = 2;
    paginationServiceStub.pagination.pageSize = 10;
    paginationServiceStub.pagination.pageSizeOptions = defaultPagination.pageSizeOptions;
    (component as any).clarinLicenseService.searchBy.calls.reset();
    paginationServiceStub.resetPage.calls.reset();
    (component as any).previousSearchTerm = 'Universal';
    component.searchingLicenseName = 'Universal';

    component.searchLicenses();

    expect(paginationServiceStub.resetPage).not.toHaveBeenCalled();
    expect((component as any).clarinLicenseService.searchBy).toHaveBeenCalledWith(
      'byNameLike',
      jasmine.objectContaining({
        currentPage: 2,
        elementsPerPage: 10,
      }),
      false
    );
  });
});
