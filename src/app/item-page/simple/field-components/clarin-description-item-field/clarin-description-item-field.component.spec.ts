import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClarinDescriptionItemFieldComponent } from './clarin-description-item-field.component';
import { Item } from '../../../../core/shared/item.model';
import { createSuccessfulRemoteDataObject$ } from '../../../../shared/remote-data.utils';
import { createPaginatedList } from '../../../../shared/testing/utils.test';

describe('ClarinDescriptionItemFieldComponent', () => {
  let component: ClarinDescriptionItemFieldComponent;
  let fixture: ComponentFixture<ClarinDescriptionItemFieldComponent>;

  const mockItem: Item = Object.assign(new Item(), {
    bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
    metadata: {
      'dc.identifier.uri': [
        {
          language: 'en_US',
          value: 'some handle'
        }
      ]
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinDescriptionItemFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClarinDescriptionItemFieldComponent);
    component = fixture.componentInstance;
    component.fields = ['dc.identifier.uri'];
    component.item = mockItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show markup in the description as text and keep URLs as links', () => {
    component.item = Object.assign(new Item(), {
      metadata: {
        'dc.description': [{ language: null, value: '<b>Bold</b> <img src="pixel.png"> See https://example.org' }]
      }
    });
    component.fields = ['dc.description'];
    component.ngOnInit();
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('b, img')).toBeNull();
    expect(element.textContent).toContain('<b>Bold</b> <img src="pixel.png"> See https://example.org');
    expect(element.querySelector('a').getAttribute('href')).toEqual('https://example.org');
  });
});
