import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinRefFeaturedServicesComponent } from './clarin-ref-featured-services.component';

describe('ClarinRefFeaturedServicesComponent', () => {
  let component: ClarinRefFeaturedServicesComponent;
  let fixture: ComponentFixture<ClarinRefFeaturedServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinRefFeaturedServicesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinRefFeaturedServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
