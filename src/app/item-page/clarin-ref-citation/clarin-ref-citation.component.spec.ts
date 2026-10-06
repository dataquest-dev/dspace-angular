import { fakeAsync, tick } from '@angular/core/testing';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

import { ClarinRefCitationComponent } from './clarin-ref-citation.component';
import { Item } from '../../core/shared/item.model';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { ItemIdentifierService } from '../../shared/item-identifier.service';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';

describe('ClarinRefCitationComponent', () => {
  const repositoryName = 'DSpace at University of West Bohemia';

  let component: ClarinRefCitationComponent;
  let configurationService: jasmine.SpyObj<ConfigurationDataService>;
  let itemIdentifierService: jasmine.SpyObj<ItemIdentifierService>;

  const buildItem = (metadata: any): Item => Object.assign(new Item(), { metadata });

  const baseMetadata = {
    'dc.contributor.author': [{ value: 'Novák, Jan' }],
    'dc.date.issued': [{ value: '2026-01-01' }],
    'dc.title': [{ value: 'Test item' }],
    'dc.identifier.uri': [{ value: 'http://hdl.handle.net/123456789/3' }],
  };

  beforeEach(() => {
    configurationService = jasmine.createSpyObj('ConfigurationDataService', ['findByPropertyName']);
    configurationService.findByPropertyName.and.returnValue(
      createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'dspace.name',
        values: [repositoryName],
      })),
    );
    itemIdentifierService = jasmine.createSpyObj('ItemIdentifierService', ['prettifyIdentifier']);
    itemIdentifierService.prettifyIdentifier.and.returnValue(Promise.resolve('123456789/3'));

    component = new ClarinRefCitationComponent(
      configurationService,
      null,
      { triggers: '' } as NgbTooltipConfig,
      null,
      null,
      null,
      null,
      itemIdentifierService,
    );
  });

  it('uses dc.publisher as the citation publisher when present', fakeAsync(() => {
    component.item = buildItem({ ...baseMetadata, 'dc.publisher': [{ value: 'Zenodo' }] });
    component.ngOnInit();
    tick();
    expect(component.publisherText).toBe('Zenodo');
  }));

  it('falls back to the repository name when dc.publisher is missing', fakeAsync(() => {
    component.item = buildItem({ ...baseMetadata });
    component.ngOnInit();
    tick();
    expect(component.publisherText).toBe(repositoryName);
  }));

  it('uses dc.publisher even when it is also the author fallback', fakeAsync(() => {
    component.item = buildItem({
      'dc.date.issued': [{ value: '2026-01-01' }],
      'dc.title': [{ value: 'Test item' }],
      'dc.identifier.uri': [{ value: 'http://hdl.handle.net/123456789/3' }],
      'dc.publisher': [{ value: 'Springer Nature' }],
    });
    component.ngOnInit();
    tick();
    expect(component.publisherText).toBe('Springer Nature');
  }));
});
