import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { Bitstream } from '../../core/shared/bitstream.model';
import { ClarinBitstreamTokenExpiredComponent } from './clarin-bitstream-token-expired.component';

describe('ClarinBitstreamTokenExpiredComponent', () => {
  let component: ClarinBitstreamTokenExpiredComponent;
  let fixture: ComponentFixture<ClarinBitstreamTokenExpiredComponent>;
  let hardRedirectService: jasmine.SpyObj<HardRedirectService>;

  const bitstream = Object.assign(new Bitstream(), { uuid: 'bitstream-uuid' });

  beforeEach(async () => {
    hardRedirectService = jasmine.createSpyObj('hardRedirectService', ['redirect']);

    await TestBed.configureTestingModule({
      imports: [
        ClarinBitstreamTokenExpiredComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: HardRedirectService, useValue: hardRedirectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinBitstreamTokenExpiredComponent);
    component = fixture.componentInstance;
    component.bitstream$ = of(bitstream);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not redirect before the delay elapses', fakeAsync(() => {
    fixture.detectChanges();

    tick(4999);
    expect(hardRedirectService.redirect).not.toHaveBeenCalled();

    tick(1);
  }));

  it('should redirect to the bitstream download route after the delay', fakeAsync(() => {
    fixture.detectChanges();

    tick(5000);
    expect(hardRedirectService.redirect).toHaveBeenCalledWith('/bitstreams/bitstream-uuid/download');
  }));
});
