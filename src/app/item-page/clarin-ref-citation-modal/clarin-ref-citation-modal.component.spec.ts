import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinRefCitationModalComponent } from './clarin-ref-citation-modal.component';

describe('ClarinRefCitationModalComponent', () => {
  let component: ClarinRefCitationModalComponent;
  let fixture: ComponentFixture<ClarinRefCitationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinRefCitationModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinRefCitationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
