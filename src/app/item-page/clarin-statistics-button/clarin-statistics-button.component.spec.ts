import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinStatisticsButtonComponent } from './clarin-statistics-button.component';

describe('ClarinStatisticsButtonComponent', () => {
  let component: ClarinStatisticsButtonComponent;
  let fixture: ComponentFixture<ClarinStatisticsButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinStatisticsButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinStatisticsButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
