import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Item } from '../../../../core/shared/item.model';
import { ClarinDescriptionItemFieldComponent } from './clarin-description-item-field.component';

describe('ClarinDescriptionItemFieldComponent', () => {

  let component: ClarinDescriptionItemFieldComponent;
  let fixture: ComponentFixture<ClarinDescriptionItemFieldComponent>;

  function itemWithDescriptions(values: { value: string, language: string }[]): Item {
    return Object.assign(new Item(), {
      metadata: {
        'dc.description': values,
      },
    });
  }

  function render(item: Item): void {
    fixture = TestBed.createComponent(ClarinDescriptionItemFieldComponent);
    component = fixture.componentInstance;
    component.fields = ['dc.description'];
    component.item = item;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClarinDescriptionItemFieldComponent],
    }).compileComponents();
  });

  it('should render one element per description value', () => {
    render(itemWithDescriptions([
      { value: 'first description', language: 'en_US' },
      { value: 'second description', language: 'cs_CZ' },
    ]));

    const divs = fixture.debugElement.queryAll(By.css('div'));
    expect(divs.length).toBe(2);
    expect(divs[0].nativeElement.textContent).toContain('first description');
    expect(divs[1].nativeElement.textContent).toContain('second description');
  });

  it('should give each value its own normalized BCP 47 lang attribute', () => {
    render(itemWithDescriptions([
      { value: 'anglicky', language: 'en_US' },
      { value: 'cesky', language: 'cs_CZ' },
    ]));

    const divs = fixture.debugElement.queryAll(By.css('div'));
    expect(divs[0].nativeElement.getAttribute('lang')).toEqual('en-US');
    expect(divs[1].nativeElement.getAttribute('lang')).toEqual('cs-CZ');
    expect(fixture.nativeElement.innerHTML).not.toContain('lang="en_US"');
  });

  it('should omit the lang attribute for the wildcard language', () => {
    render(itemWithDescriptions([{ value: 'language independent', language: '*' }]));

    const div = fixture.debugElement.query(By.css('div'));
    expect(div.nativeElement.hasAttribute('lang')).toBeFalse();
    expect(fixture.nativeElement.innerHTML).not.toContain('lang="*"');
  });

  it('should still turn URLs in the description into links', () => {
    render(itemWithDescriptions([
      { value: 'see https://lindat.cz for more', language: 'en_US' },
    ]));

    const anchor = fixture.debugElement.query(By.css('div a'));
    expect(anchor).toBeTruthy();
    expect(anchor.nativeElement.getAttribute('href')).toEqual('https://lindat.cz');
    expect(anchor.nativeElement.getAttribute('target')).toEqual('_blank');
  });

  it('should show markup in the description as text and keep URLs as links', () => {
    render(itemWithDescriptions([
      { value: '<b>Bold</b> <img src="pixel.png"> See https://example.org', language: 'en_US' },
    ]));

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('b, img')).toBeNull();
    expect(element.textContent).toContain('<b>Bold</b> <img src="pixel.png"> See https://example.org');
    expect(element.querySelector('a').getAttribute('href')).toEqual('https://example.org');
  });

  it('should render nothing when the item has no description', () => {
    render(Object.assign(new Item(), { metadata: {} }));

    expect(component.descriptionEntries).toEqual([]);
    expect(fixture.debugElement.queryAll(By.css('div')).length).toBe(0);
  });

});
