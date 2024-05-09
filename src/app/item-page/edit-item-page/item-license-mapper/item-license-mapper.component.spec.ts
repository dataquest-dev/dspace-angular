import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemLicenseMapperComponent } from './item-license-mapper.component';

describe('ItemLicenseMapperComponent', () => {
  let component: ItemLicenseMapperComponent;
  let fixture: ComponentFixture<ItemLicenseMapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemLicenseMapperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemLicenseMapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
