import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { Bitstream } from '../../core/shared/bitstream.model';
import { ClarinBitstreamAuthorizationDeniedComponent } from './clarin-bitstream-authorization-denied.component';

describe('ClarinBitstreamAuthorizationDeniedComponent', () => {
  let component: ClarinBitstreamAuthorizationDeniedComponent;
  let fixture: ComponentFixture<ClarinBitstreamAuthorizationDeniedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClarinBitstreamAuthorizationDeniedComponent,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinBitstreamAuthorizationDeniedComponent);
    component = fixture.componentInstance;
    component.bitstream$ = of(Object.assign(new Bitstream(), { name: 'denied.txt' }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the denial message', () => {
    const heading = fixture.debugElement.query(By.css('h3'));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent)
      .toContain('clarin.bitstream.authorization.denied.message');
  });
});
