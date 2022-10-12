import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinNavbarTopComponent } from './clarin-navbar-top.component';
import {AuthServiceStub} from '../shared/testing/auth-service.stub';
import {CommonModule} from '@angular/common';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateLoaderMock} from '../shared/mocks/translate-loader.mock';
import {EPersonFormComponent} from '../access-control/epeople-registry/eperson-form/eperson-form.component';
import {EPersonDataService} from '../core/eperson/eperson-data.service';
import {AuthService} from '../core/auth/auth.service';
import {createdLicenseLabelRD$} from '../shared/testing/clarin-license-mock';
import {of} from 'rxjs';
import {createSuccessfulRemoteDataObject$} from '../shared/remote-data.utils';
import {EPersonMock} from '../shared/testing/eperson.mock';

describe('ClarinNavbarTopComponent', () => {
  let component: ClarinNavbarTopComponent;
  let fixture: ComponentFixture<ClarinNavbarTopComponent>;

  let authService: AuthServiceStub;
  authService = jasmine.createSpyObj('authService', {
    isAuthenticated: of(true),
    getAuthenticatedUserFromStore: createSuccessfulRemoteDataObject$(EPersonMock)
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, NgbModule, FormsModule, ReactiveFormsModule, BrowserModule,
        TranslateModule.forRoot(),
      ],
      declarations: [ClarinNavbarTopComponent],
      providers: [
        { provide: AuthService, useValue: authService }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinNavbarTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
