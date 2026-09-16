import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';

import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { TranslateLoaderMock } from '../../../shared/mocks/translate-loader.mock';
import { HELP_DESK_PROPERTY } from '../tombstone.constants';
import { WithdrawnTombstoneComponent } from './withdrawn-tombstone.component';

describe('WithdrawnTombstoneComponent', () => {
  let component: WithdrawnTombstoneComponent;
  let fixture: ComponentFixture<WithdrawnTombstoneComponent>;

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of(true),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateLoaderMock,
        },
      }), RouterTestingModule.withRoutes([]), BrowserAnimationsModule, WithdrawnTombstoneComponent],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawnTombstoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request the help-desk address and render the withdrawal reason', () => {
    component.itemName = 'Withdrawn item';
    component.reasonOfWithdrawal = 'Duplicate record';
    component.authors = ['Doe, Jane'];
    fixture.detectChanges();

    expect(configurationServiceSpy.findByPropertyName).toHaveBeenCalledWith(HELP_DESK_PROPERTY);
    expect(fixture.nativeElement.textContent).toContain('Withdrawn item');
    expect(fixture.nativeElement.textContent).toContain('Duplicate record');
    expect(fixture.nativeElement.textContent).toContain('Doe, Jane');
  });
});
