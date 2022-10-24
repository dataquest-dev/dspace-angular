import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemManageClarinLicenseComponent } from './item-manage-clarin-license.component';

describe('ItemManageClarinLicenseComponent', () => {
  let component: ItemManageClarinLicenseComponent;
  let fixture: ComponentFixture<ItemManageClarinLicenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemManageClarinLicenseComponent ]
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
});
