import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { of as observableOf } from 'rxjs';
import { ClarinRefCitationComponent } from './clarin-ref-citation.component';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { RequestService } from '../../core/data/request.service';
import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { Item } from '../../core/shared/item.model';
import { createSuccessfulRemoteDataObject } from '../../shared/remote-data.utils';

describe('ClarinRefCitationComponent', () => {
  const handleUrl = 'https://hdl.handle.net/123456789/1';
  const displayText = 'Doe, 2024, <i>Title<img src="x" onerror="void 0"></i>, ' +
    '<a href="javascript:void 0">bad link</a>, <a href="' + handleUrl + '">' + handleUrl + '</a>.' +
    '<script>void 0</script>';

  let fixture: ComponentFixture<ClarinRefCitationComponent>;
  let citation: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClarinRefCitationComponent],
      imports: [TranslateModule.forRoot(), NgbTooltipModule],
      providers: [
        { provide: ConfigurationDataService, useValue: {} },
        { provide: RequestService, useValue: jasmine.createSpyObj('requestService', ['generateRequestId', 'send']) },
        { provide: HALEndpointService, useValue: { getRootHref: () => 'https://rest.test/server/api' } },
        {
          provide: RemoteDataBuildService, useValue: jasmine.createSpyObj('rdbService', {
            buildFromRequestUUID: observableOf(createSuccessfulRemoteDataObject({ displayText })),
          })
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinRefCitationComponent);
    fixture.componentInstance.item = Object.assign(new Item(), { handle: '123456789/1', metadata: {} });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    citation = fixture.nativeElement.querySelector('.clarin-ref-box-text');
  });

  it('should not render scripts or event handlers from the display text', () => {
    expect(citation.querySelector('script')).toBeNull();
    expect(citation.querySelector('[onerror]')).toBeNull();
    expect(citation.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it('should keep the citation formatting', () => {
    expect(citation.querySelector('i').textContent).toBe('Title');
    expect(citation.querySelector('a[href="' + handleUrl + '"]').textContent).toBe(handleUrl);
  });
});
