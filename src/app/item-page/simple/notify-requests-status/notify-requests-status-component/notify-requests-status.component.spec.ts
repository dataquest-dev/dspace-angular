import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { NotifyRequestsStatusDataService } from 'src/app/core/data/notify-services-status-data.service';

import { NotifyInfoService } from '../../../../core/coar-notify/notify-info/notify-info.service';
import { createSuccessfulRemoteDataObject$ } from '../../../../shared/remote-data.utils';
import { NotifyRequestsStatus } from '../notify-requests-status.model';
import { RequestStatusEnum } from '../notify-status.enum';
import { RequestStatusAlertBoxComponent } from '../request-status-alert-box/request-status-alert-box.component';
import { NotifyRequestsStatusComponent } from './notify-requests-status.component';

describe('NotifyRequestsStatusComponent', () => {
  let component: NotifyRequestsStatusComponent;
  let fixture: ComponentFixture<NotifyRequestsStatusComponent>;
  let notifyInfoServiceSpy;
  let notifyInfoSpy;

  const mock: NotifyRequestsStatus = Object.assign(new NotifyRequestsStatus(), {
    notifyStatus: [],
    itemuuid: 'testUuid',
  });

  beforeEach(waitForAsync(() => {
    notifyInfoServiceSpy = {
      getNotifyRequestsStatus:() => createSuccessfulRemoteDataObject$(mock),
    };
    notifyInfoSpy = {
      isCoarConfigEnabled: () => of(true),
    };
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), NotifyRequestsStatusComponent],
      providers: [
        { provide: NotifyRequestsStatusDataService, useValue: notifyInfoServiceSpy },
        { provide: NotifyInfoService, useValue: notifyInfoSpy },
      ],
    }).overrideComponent(NotifyRequestsStatusComponent, {
      remove: {
        imports: [RequestStatusAlertBoxComponent],
      },
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotifyRequestsStatusComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch data from the service on initialization', fakeAsync(() => {
    const mockData: NotifyRequestsStatus = Object.assign(new NotifyRequestsStatus(), {
      notifyStatus: [],
      itemuuid: 'testUuid',
    });
    component.itemUuid = mockData.itemuuid;
    spyOn(notifyInfoServiceSpy, 'getNotifyRequestsStatus').and.callThrough();
    component.ngOnInit();
    fixture.detectChanges();
    tick();

    expect(notifyInfoServiceSpy.getNotifyRequestsStatus).toHaveBeenCalledWith('testUuid');
    component.requestMap$.subscribe((map) => {
      expect(map.size).toBe(0);
    });
  }));

  it('should not ask the backend for the request status when COAR Notify is disabled', fakeAsync(() => {
    spyOn(notifyInfoSpy, 'isCoarConfigEnabled').and.returnValue(of(false));
    spyOn(notifyInfoServiceSpy, 'getNotifyRequestsStatus').and.callThrough();

    component.itemUuid = 'testUuid';
    component.ngOnInit();
    component.requestMap$.subscribe();
    tick();

    expect(notifyInfoServiceSpy.getNotifyRequestsStatus).not.toHaveBeenCalled();
  }));

  it('should group data by status', () => {
    const mockData: NotifyRequestsStatus = Object.assign(new NotifyRequestsStatus(), {
      notifyStatus: [
        {
          serviceName: 'test1',
          serviceUrl: 'test',
          status: RequestStatusEnum.ACCEPTED,
        },
        {
          serviceName: 'test2',
          serviceUrl: 'test',
          status: RequestStatusEnum.REJECTED,
        },
        {
          serviceName: 'test3',
          serviceUrl: 'test',
          status: RequestStatusEnum.ACCEPTED,
        },
      ],
      itemUuid: 'testUuid',
    });
    spyOn(notifyInfoServiceSpy, 'getNotifyRequestsStatus').and.returnValue(createSuccessfulRemoteDataObject$(mockData));
    fixture.detectChanges();
    (component as any).groupDataByStatus(mockData);
    component.requestMap$.subscribe((map) => {
      expect(map.size).toBe(2);
      expect(map.get(RequestStatusEnum.ACCEPTED)?.length).toBe(2);
      expect(map.get(RequestStatusEnum.REJECTED)?.length).toBe(1);
    });
  });
});
