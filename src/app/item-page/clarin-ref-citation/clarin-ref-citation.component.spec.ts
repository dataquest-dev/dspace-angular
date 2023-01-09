import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinRefCitationComponent } from './clarin-ref-citation.component';

describe('ClarinRefCitationComponent', () => {
  let component: ClarinRefCitationComponent;
  let fixture: ComponentFixture<ClarinRefCitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinRefCitationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinRefCitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
