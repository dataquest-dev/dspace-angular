import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinAuthorItemFieldComponent } from './clarin-author-item-field.component';

describe('ClarinAuthorItemFieldComponent', () => {
  let component: ClarinAuthorItemFieldComponent;
  let fixture: ComponentFixture<ClarinAuthorItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinAuthorItemFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinAuthorItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
