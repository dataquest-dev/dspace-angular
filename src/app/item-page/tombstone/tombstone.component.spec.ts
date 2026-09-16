import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';

import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { Item } from '../../core/shared/item.model';
import { DSONameServiceMock } from '../../shared/mocks/dso-name.service.mock';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { TombstoneComponent } from './tombstone.component';

describe('TombstoneComponent', () => {
  let component: TombstoneComponent;
  let fixture: ComponentFixture<TombstoneComponent>;

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
      }), RouterTestingModule.withRoutes([]), BrowserAnimationsModule, TombstoneComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: DSONameService, useClass: DSONameServiceMock },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
      ],

    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TombstoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the withdrawal reason and the authors from the item metadata', () => {
    component.item = Object.assign(new Item(), {
      metadata: {
        'local.withdrawn.reason': [{ value: 'Duplicate record' }],
        'dc.contributor.author': [{ value: 'Doe, Jane' }],
        'dc.contributor.other': [{ value: 'Roe, Richard' }],
      },
    });
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.reasonOfWithdrawal).toBe('Duplicate record');
    expect(component.authors).toEqual(['Doe, Jane', 'Roe, Richard']);
    expect(fixture.debugElement.query(By.css('ds-withdrawn-tombstone'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('ds-replaced-tombstone'))).toBeNull();
  });

  it('should switch to the replaced tombstone when dc.relation.isreplacedby is set', () => {
    component.item = Object.assign(new Item(), {
      metadata: {
        'dc.relation.isreplacedby': [{ value: 'http://example.org/handle/123456789/1' }],
      },
    });
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isReplaced).toBe('http://example.org/handle/123456789/1');
    expect(fixture.debugElement.query(By.css('ds-replaced-tombstone'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('ds-withdrawn-tombstone'))).toBeNull();
  });
});
