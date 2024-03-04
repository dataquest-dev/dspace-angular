import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinFilesSectionComponent } from './clarin-files-section.component';

describe('ClarinFilesSectionComponent', () => {
  let component: ClarinFilesSectionComponent;
  let fixture: ComponentFixture<ClarinFilesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinFilesSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClarinFilesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
