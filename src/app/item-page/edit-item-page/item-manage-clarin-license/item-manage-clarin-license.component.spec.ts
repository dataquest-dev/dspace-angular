import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';

import { ItemManageClarinLicenseComponent } from './item-manage-clarin-license.component';
import {SharedModule} from '../../../shared/shared.module';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {RouterTestingModule} from '@angular/router/testing';
import {RequestService} from '../../../core/data/request.service';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {NotificationsService} from '../../../shared/notifications/notifications.service';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, convertToParamMap, Params} from '@angular/router';
import {ItemDataService} from '../../../core/data/item-data.service';
import {BehaviorSubject, of, of as observableOf} from 'rxjs';
import {createSuccessfulRemoteDataObject, createSuccessfulRemoteDataObject$} from '../../../shared/remote-data.utils';
import {Item} from '../../../core/shared/item.model';
import {
  mockLicense,
  mockLicenseList, mockLicenseRD$,
  mockSecondLicense,
  mockThirdLicense
} from '../../../shared/testing/clarin-license-mock';
import {RequestEntry} from '../../../core/data/request.reducer';
import {RestResponse} from '../../../core/cache/response.models';
import {cold, getTestScheduler} from 'jasmine-marbles';
import {buildPaginatedList} from '../../../core/data/paginated-list.model';
import {PageInfo} from '../../../core/shared/page-info.model';
import {NotificationsServiceStub} from '../../../shared/testing/notifications-service.stub';
import {TestScheduler} from 'rxjs/testing';
import {By} from '@angular/platform-browser';
import {ClarinLicenseTableComponent} from '../../../clarin-licenses/clarin-license-table/clarin-license-table.component';

describe('ItemManageClarinLicenseComponent', () => {
  let component: ItemManageClarinLicenseComponent;
  let fixture: ComponentFixture<ItemManageClarinLicenseComponent>;

  let itemService: ItemDataService;
  let requestService: RequestService;
  let clarinLicenseService: ClarinLicenseDataService;
  let modalStub: NgbModal;
  let notificationService: NotificationsServiceStub;
  let scheduler: TestScheduler;

  const responseCacheEntry = new RequestEntry();
  responseCacheEntry.response = new RestResponse(true, 200, 'Success');

  const itemHref = 'test href';

  const clarinLicense = mockLicense;
  const mockItem = Object.assign(new Item(), {
    metadata: { 'dc.rights': [{ value: clarinLicense.name }], 'dc.rights.uri': [{ value: clarinLicense.definition }] },
    _links: {
      self: {
        href: itemHref
      }
    }
  });

  itemService = jasmine.createSpyObj('itemService', {
    findByHref: of(createSuccessfulRemoteDataObject(mockItem))
  });

  clarinLicenseService = jasmine.createSpyObj('clarinLicenseService', {
    create: createSuccessfulRemoteDataObject$(mockLicense),
    findAll: createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), mockLicenseList))
  });
  modalStub = jasmine.createSpyObj('modalService', ['close', 'open']);
  notificationService = new NotificationsServiceStub();

  beforeEach(async () => {
    scheduler = getTestScheduler();

    requestService = jasmine.createSpyObj('requestService', {
      generateRequestId: '123456',
      send: {},
      getByUUID: cold('a', { a: responseCacheEntry }),
    });

    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ],
      declarations: [ ItemManageClarinLicenseComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: { parent: { data: observableOf(
          { dso: createSuccessfulRemoteDataObject(mockItem) }) } }  },
        { provide: ItemDataService, useValue: itemService },
        { provide: RequestService, useValue: requestService },
        { provide: ClarinLicenseDataService, useValue: clarinLicenseService },
        { provide: NotificationsService, useValue: notificationService },
        { provide: NgbModal, useValue: modalStub }
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemManageClarinLicenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Check all properties to be loaded after init: itemSelfLink, licenseOptions, selectedLicenseName = ''
  it('check all properties to be loaded after init: itemSelfLink, licenseOptions, selectedLicenseName = \'\'',
    waitForAsync(() => {
    fixture.whenStable().then(() => {
      expect(component.itemSelfLink).toBe(itemHref);
      expect(component.licenseOptions.value).toEqual(mockLicenseList);
      expect(component.selectedLicenseName).toBe(mockLicense.name);
      expect(component.selectedLicense.value.name).toEqual(mockLicense.name);
    });
  }));

  // Open modal after clicking on the `Define New License`
  it('should open modal after clicking on the `Define New License`', () => {
    const defineLicense = fixture.debugElement.query(By.css('#defineLicenseButton'));
    defineLicense.triggerEventHandler('click', {
      preventDefault: () => {/**/
      }
    });

    expect(modalStub.open).toHaveBeenCalled();
  });

  // Define a new Clarin Licenses and it should be added to the License Options
  it('should define a new Clarin License and add it to the License Options', waitForAsync(() => {
    // Third license is not in the license options by default
    component.defineNewLicense(mockLicense);
    expect(clarinLicenseService.create).toHaveBeenCalled();
    // Notificate successful response
    expect(notificationService.success).toHaveBeenCalled();
    fixture.detectChanges();

    // The new clarin license should be added to the license options
    fixture.whenStable().then(() => {
      expect(clarinLicenseService.findAll).toHaveBeenCalled();
    });
  }));

  // Should detach the clarin license from the item after clicking on `Remove License` button
  it('Should detach the clarin license from the item after clicking on `Remove License` button',() => {
    spyOn(component, 'sendReplaceRequest').and.returnValue('123456');

    const defineLicense = fixture.debugElement.query(By.css('#removeLicenseButton'));
    defineLicense.triggerEventHandler('click', {
      preventDefault: () => {/**/
      }
    });

    const clarinLicenseName = mockLicense.name;
    component.selectedLicenseName = clarinLicenseName;

    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.sendReplaceRequest).toHaveBeenCalledWith('detach', clarinLicenseName);
      expect(requestService.send).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });
  });

  // Should change the Clarin License in the Item after clicking on `Update` button
  it('should change the Clarin License in the Item after clicking on `Update` button',
    () => {
      spyOn(component, 'sendReplaceRequest');

      const updateButton = fixture.debugElement.query(By.css('#updateButton'));
      updateButton.triggerEventHandler('click', {
        preventDefault: () => {/**/
        }
      });

      const clarinLicenseName = mockSecondLicense.name;
      component.selectedLicenseName = clarinLicenseName;

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.sendReplaceRequest).toHaveBeenCalledWith('attach', clarinLicenseName);
        expect(requestService.send).toHaveBeenCalled();
        expect(notificationService.success).toHaveBeenCalled();
      });
    });

  // Should revert non-submitted changes
  it('should revert non-submitted changes after click on `Return` button',
    () => {
      const updateButton = fixture.debugElement.query(By.css('#returnButton'));
      updateButton.triggerEventHandler('click', {
        preventDefault: () => {/**/
        }
      });

      component.selectedLicenseName = mockThirdLicense.name;

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.selectedLicenseName).toEqual(component.selectedLicense.value.name);
      });
    });
});
