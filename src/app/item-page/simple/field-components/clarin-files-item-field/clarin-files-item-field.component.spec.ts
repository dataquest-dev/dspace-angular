import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinFilesItemFieldComponent } from './clarin-files-item-field.component';

describe('ClarinFilesItemFieldComponent', () => {
  let component: ClarinFilesItemFieldComponent;
  let fixture: ComponentFixture<ClarinFilesItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinFilesItemFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinFilesItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
