import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinRefBoxComponent } from './clarin-ref-box.component';

describe('ClarinRefBoxComponent', () => {
  let component: ClarinRefBoxComponent;
  let fixture: ComponentFixture<ClarinRefBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinRefBoxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinRefBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});