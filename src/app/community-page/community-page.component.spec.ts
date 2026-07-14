import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of as observableOf } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CommunityPageComponent } from './community-page.component';
import { CommunityDataService } from '../core/data/community-data.service';
import { MetadataService } from '../core/metadata/metadata.service';
import { AuthService } from '../core/auth/auth.service';
import { AuthorizationDataService } from '../core/data/feature-authorization/authorization-data.service';
import { DSONameService } from '../core/breadcrumbs/dso-name.service';
import { VarDirective } from '../shared/utils/var.directive';

describe('CommunityPageComponent', () => {
  let component: CommunityPageComponent;
  let fixture: ComponentFixture<CommunityPageComponent>;

  const communityUUID = '11111111-1111-1111-1111-111111111111';
  const community = {
    id: communityUUID,
    uuid: communityUUID,
    handle: '123456789/1',
    introductoryText: null,
    sidebarText: null,
    copyrightText: null,
    logo: observableOf({ hasSucceeded: true, payload: undefined })
  };

  const communityRD = {
    hasSucceeded: true,
    hasFailed: false,
    statusCode: 200,
    payload: community
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      declarations: [CommunityPageComponent, VarDirective],
      providers: [
        { provide: ActivatedRoute, useValue: { data: observableOf({ dso: communityRD }) } },
        { provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl'), url: '/' } },
        { provide: CommunityDataService, useValue: {} },
        { provide: MetadataService, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => observableOf(false),
            setRedirectUrl: jasmine.createSpy('setRedirectUrl')
          }
        },
        { provide: AuthorizationDataService, useValue: { isAuthorized: () => observableOf(false) } },
        { provide: DSONameService, useValue: { getName: () => 'Test Community' } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityPageComponent);
    component = fixture.componentInstance;

    spyOn(component, 'ngOnInit').and.callFake(() => {
      component.communityRD$ = observableOf(communityRD as any);
      component.logoRD$ = observableOf({ hasSucceeded: true, payload: undefined } as any);
    });

    fixture.detectChanges();
  });

  it('should render the dso edit menu in the header action area', () => {
    expect(component).toBeTruthy();

    const editMenu = fixture.debugElement.query(By.css('ds-dso-edit-menu'));

    expect(editMenu).toBeTruthy();
  });
});
