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

import {  ConfigurationDataService  } from '../../../core/data/configuration-data.service';
import { TranslateLoaderMock } from '../../../shared/mocks/translate-loader.mock';
import { HELP_DESK_PROPERTY } from '../tombstone.constants';
import { ReplacedTombstoneComponent } from './replaced-tombstone.component';

describe('ReplacedTombstoneComponent', () => {
  let component: ReplacedTombstoneComponent;
  let fixture: ComponentFixture<ReplacedTombstoneComponent>;

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
      }), RouterTestingModule.withRoutes([]), BrowserAnimationsModule, ReplacedTombstoneComponent],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplacedTombstoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should request the help-desk address and link to the replacement', () => {
    component.itemName = 'Replaced item';
    component.isReplaced = 'http://example.org/handle/123456789/1';
    component.authors = ['Doe, Jane'];
    fixture.detectChanges();

    expect(configurationServiceSpy.findByPropertyName).toHaveBeenCalledWith(HELP_DESK_PROPERTY);
    expect(fixture.nativeElement.textContent).toContain('Replaced item');
    expect(fixture.nativeElement.querySelector('a[href="http://example.org/handle/123456789/1"]')).not.toBeNull();
  });
});
