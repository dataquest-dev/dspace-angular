import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Item } from '../../../../core/shared/item.model';
import { ItemIdentifierService } from '../../../../shared/item-identifier.service';
import { createSuccessfulRemoteDataObject$ } from '../../../../shared/remote-data.utils';
import { createPaginatedList } from '../../../../shared/testing/utils.test';
import { DOI_METADATA_FIELD } from '../clarin-generic-item-field/clarin-generic-item-field.constants';
import { ClarinIdentifierItemFieldComponent } from './clarin-identifier-item-field.component';

describe('ClarinIdentifierItemFieldComponent', () => {
  let component: ClarinIdentifierItemFieldComponent;
  let fixture: ComponentFixture<ClarinIdentifierItemFieldComponent>;
  let itemIdentifierService: ItemIdentifierService;

  const DOI_VALUE = 'https://doi.org/10.1234/awesome';

  const mockItem: Item = Object.assign(new Item(), {
    bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
    metadata: {
      [DOI_METADATA_FIELD]: [
        {
          language: 'en_US',
          value: DOI_VALUE,
        },
      ],
    },
  });

  beforeEach(async () => {
    itemIdentifierService = jasmine.createSpyObj('itemIdentifierService', {
      prettifyIdentifier: Promise.resolve('awesome identifier'),
    });

    await TestBed.configureTestingModule({
      imports: [
        ClarinIdentifierItemFieldComponent,
      ],
      providers: [
        { provide: ItemIdentifierService, useValue: itemIdentifierService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinIdentifierItemFieldComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
    component.fields = [DOI_METADATA_FIELD];
    fixture.detectChanges();
  });

  it('should create', async () => {
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should take the raw identifier from the configured metadata field', () => {
    expect(component.identifier).toEqual(DOI_VALUE);
    expect(itemIdentifierService.prettifyIdentifier)
      .toHaveBeenCalledWith(DOI_VALUE, [DOI_METADATA_FIELD]);
  });

  it('should link to the raw identifier and show the prettified one', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const anchor = fixture.debugElement.query(By.css('a'));
    expect(anchor.nativeElement.getAttribute('href')).toEqual(DOI_VALUE);
    expect(anchor.nativeElement.textContent).toContain('awesome identifier');
  });
});
