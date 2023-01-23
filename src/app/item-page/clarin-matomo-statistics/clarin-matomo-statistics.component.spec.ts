import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinMatomoStatisticsComponent } from './clarin-matomo-statistics.component';

describe('ClarinMatomoStatisticsComponent', () => {
  let component: ClarinMatomoStatisticsComponent;
  let fixture: ComponentFixture<ClarinMatomoStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinMatomoStatisticsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinMatomoStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
