import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinUserMetadataFormComponent } from './clarin-user-metadata-form.component';

describe('ClarinUserMetadataFormComponent', () => {
  let component: ClarinUserMetadataFormComponent;
  let fixture: ComponentFixture<ClarinUserMetadataFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinUserMetadataFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinUserMetadataFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
