import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseContractPageComponent } from './license-contract-page.component';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {FormComponent} from '../shared/form/form.component';
import {SubmissionSectionLicenseComponent} from '../submission/sections/license/section-license.component';
import {ActivatedRoute, Params} from '@angular/router';
import {createSuccessfulRemoteDataObject$} from '../shared/remote-data.utils';
import {CollectionDataService} from '../core/data/collection-data.service';
import {ContentSource} from '../core/shared/content-source.model';
import {Collection} from '../core/shared/collection.model';

describe('LicenseContractPageComponent', () => {
  let component: LicenseContractPageComponent;
  let fixture: ComponentFixture<LicenseContractPageComponent>;

  let collection: Collection;

  let routeStub: any;
  let collectionService: CollectionDataService;

  const paramCollectionId = 'collectionId';
  const paramCollectionIdValue = '1';

  const paramObject: Params = {};
  paramObject[paramCollectionId] = paramCollectionIdValue;

  collection = Object.assign(new Collection(), {
    uuid: 'fake-collection-id',
    _links: {
      self: {href: 'collection-selflink'},
      license: {href: 'license-link'}
    }
  });

  routeStub = {
    snapshot: {
      queryParams: paramObject,
    }
  };

  collectionService = jasmine.createSpyObj('collectionService', {
    findById: createSuccessfulRemoteDataObject$(collection)
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      declarations: [
        LicenseContractPageComponent
      ],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: CollectionDataService, useValue: collectionService },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LicenseContractPageComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
