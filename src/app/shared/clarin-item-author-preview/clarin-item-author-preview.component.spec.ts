import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { Item } from '../../core/shared/item.model';
import { MetadataValue } from '../../core/shared/metadata.models';
import { createSuccessfulRemoteDataObject$ } from '../remote-data.utils';
import { ClarinItemAuthorPreviewComponent } from './clarin-item-author-preview.component';

describe('ClarinItemAuthorPreviewComponent', () => {
  let component: ClarinItemAuthorPreviewComponent;
  let fixture: ComponentFixture<ClarinItemAuthorPreviewComponent>;

  const BASE_URL = 'https://lindat.example.org';

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: createSuccessfulRemoteDataObject$({ values: [BASE_URL] }),
  });

  function itemWithAuthors(authors: { value: string, authority?: string }[]): Item {
    return Object.assign(new Item(), {
      metadata: {
        'dc.contributor.author': authors.map(author => Object.assign(new MetadataValue(), {
          key: 'dc.contributor.author',
          language: 'en_US',
          ...author,
        })),
      },
    });
  }

  async function render(item: Item): Promise<void> {
    component.item = item;
    component.fields = ['dc.contributor.author'];
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClarinItemAuthorPreviewComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinItemAuthorPreviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the UI base url from the configuration and build author search links on it', async () => {
    await render(itemWithAuthors([{ value: 'Novak, Jan' }]));

    expect(configurationServiceSpy.findByPropertyName).toHaveBeenCalledWith('dspace.ui.url');
    expect(component.baseUrl).toEqual(BASE_URL);
    expect(component.itemAuthors.value.length).toEqual(1);
    expect(component.itemAuthors.value[0].name).toEqual('Novak, Jan');
    expect(component.itemAuthors.value[0].url).toContain(`${BASE_URL}/search?`);
  });

  it('should mark an author that carries an authority', async () => {
    await render(itemWithAuthors([
      { value: 'Novak, Jan', authority: 'orcid-id' },
      { value: 'Dvorak, Petr' },
    ]));

    expect(component.itemAuthors.value.map(author => author.isAuthority)).toEqual([true, false]);
  });

  it('should render one link per author', async () => {
    await render(itemWithAuthors([{ value: 'Novak, Jan' }, { value: 'Dvorak, Petr' }]));

    const links = fixture.debugElement.queryAll(By.css('a.item-author'));
    expect(links.length).toEqual(2);
    expect(links[0].nativeElement.textContent).toContain('Novak, Jan');
  });

  it('should toggle the full author list', () => {
    expect(component.showEveryAuthor.value).toBeFalse();

    component.toggleShowEveryAuthor();
    expect(component.showEveryAuthor.value).toBeTrue();

    component.toggleShowEveryAuthor();
    expect(component.showEveryAuthor.value).toBeFalse();
  });
});
