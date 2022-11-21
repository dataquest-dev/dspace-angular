import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinBitstreamDownloadPageComponent } from './clarin-bitstream-download-page.component';

describe('ClarinBitstreamDownloadPageComponent', () => {
  let component: ClarinBitstreamDownloadPageComponent;
  let fixture: ComponentFixture<ClarinBitstreamDownloadPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinBitstreamDownloadPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinBitstreamDownloadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});