import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinCollectionsItemFieldComponent } from './clarin-collections-item-field.component';

describe('ClarinCollectionsItemFieldComponent', () => {
  let component: ClarinCollectionsItemFieldComponent;
  let fixture: ComponentFixture<ClarinCollectionsItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinCollectionsItemFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinCollectionsItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
