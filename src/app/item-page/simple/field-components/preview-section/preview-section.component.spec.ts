import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewSectionComponent } from './preview-section.component';

describe('PreviewSectionComponent', () => {
  let component: PreviewSectionComponent;
  let fixture: ComponentFixture<PreviewSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreviewSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
