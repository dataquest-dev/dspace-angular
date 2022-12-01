import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClarinBitstreamTokenExpiredComponent } from './clarin-bitstream-token-expired.component';

describe('ClarinBitstreamTokenExpiredComponent', () => {
  let component: ClarinBitstreamTokenExpiredComponent;
  let fixture: ComponentFixture<ClarinBitstreamTokenExpiredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinBitstreamTokenExpiredComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinBitstreamTokenExpiredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
