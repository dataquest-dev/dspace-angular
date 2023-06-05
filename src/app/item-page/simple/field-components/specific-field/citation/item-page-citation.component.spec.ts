import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ItemPageCitationFieldComponent } from './item-page-citation.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';

describe('ItemPageCitationFieldComponent', () => {
  let component: ItemPageCitationFieldComponent;
  let fixture: ComponentFixture<ItemPageCitationFieldComponent>;
  let sanitizer: DomSanitizer;
  const mockHandle = '15240/151431';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemPageCitationFieldComponent ],
      schemas: [ NO_ERRORS_SCHEMA ]
    }).overrideComponent(ItemPageCitationFieldComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    }).compileComponents();

    sanitizer = TestBed.inject(DomSanitizer);
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ItemPageCitationFieldComponent);
    component = fixture.componentInstance;
    component.handle = mockHandle;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set iframeSrc based on handle', () => {
    const expectedUrl = 'https://www.citacepro.com/api/dspace/citace/oai:dspace.tul.cz:' + mockHandle;
    expect(component.iframeSrc).toEqual(sanitizer.bypassSecurityTrustResourceUrl(expectedUrl));
  });
});
