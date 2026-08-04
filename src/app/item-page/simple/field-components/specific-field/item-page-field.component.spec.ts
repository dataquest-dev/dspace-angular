import {
  ChangeDetectionStrategy,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';

import { APP_CONFIG } from '../../../../../config/app-config.interface';
import { environment } from '../../../../../environments/environment';
import { BrowseService } from '../../../../core/browse/browse.service';
import { BrowseDefinitionDataService } from '../../../../core/browse/browse-definition-data.service';
import { buildPaginatedList } from '../../../../core/data/paginated-list.model';
import { BrowseDefinition } from '../../../../core/shared/browse-definition.model';
import { HierarchicalBrowseDefinition } from '../../../../core/shared/hierarchical-browse-definition.model';
import { Item } from '../../../../core/shared/item.model';
import { MathService } from '../../../../core/shared/math.service';
import {
  MetadataMap,
  MetadataValue,
} from '../../../../core/shared/metadata.models';
import { PageInfo } from '../../../../core/shared/page-info.model';
import { ValueListBrowseDefinition } from '../../../../core/shared/value-list-browse-definition.model';
import { TranslateLoaderMock } from '../../../../shared/mocks/translate-loader.mock';
import { createSuccessfulRemoteDataObject$ } from '../../../../shared/remote-data.utils';
import { BrowseDefinitionDataServiceStub } from '../../../../shared/testing/browse-definition-data-service.stub';
import { BrowseServiceStub } from '../../../../shared/testing/browse-service.stub';
import { createPaginatedList } from '../../../../shared/testing/utils.test';
import { MarkdownDirective } from '../../../../shared/utils/markdown.directive';
import { MetadataValuesComponent } from '../../../field-components/metadata-values/metadata-values.component';
import { ItemPageFieldComponent } from './item-page-field.component';

let comp: ItemPageFieldComponent;
let fixture: ComponentFixture<ItemPageFieldComponent>;
let markdownSpy;

const mockValue = 'test value';
const mockField = 'dc.test';
const mockLabel = 'test label';
const mockAuthorField = 'dc.contributor.author';
const mockDateIssuedField = 'dc.date.issued';
const mockFields = [mockField, mockAuthorField, mockDateIssuedField];

describe('ItemPageFieldComponent', () => {

  let appConfig = Object.assign({}, environment, {
    markdown: {
      enabled: false,
      mathjax: false,
    },
  });

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }),
        ItemPageFieldComponent, MetadataValuesComponent,
      ],
      providers: [
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: BrowseDefinitionDataService, useValue: BrowseDefinitionDataServiceStub },
        { provide: BrowseService, useValue: BrowseServiceStub },
        { provide: MathService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(ItemPageFieldComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    }).compileComponents();
    markdownSpy = spyOn(MarkdownDirective.prototype, 'render');
    fixture = TestBed.createComponent(ItemPageFieldComponent);
    comp = fixture.componentInstance;
    comp.item = mockItemWithMetadataFieldsAndValue(mockFields, mockValue);
    comp.fields = mockFields;
    comp.label = mockLabel;
    fixture.detectChanges();
  }));

  it('should display display the correct metadata value', () => {
    expect(fixture.nativeElement.innerHTML).toContain(mockValue);
  });

  describe('when markdown is disabled in the environment config', () => {
    beforeEach( () => {
      appConfig.markdown.enabled = false;
    });

    describe('and markdown is disabled in this component', () => {

      beforeEach(() => {
        comp.enableMarkdown = false;
        fixture.detectChanges();
      });

      it('should not use the Markdown Pipe', () => {
        expect(markdownSpy).not.toHaveBeenCalled();
      });
    });

    describe('and markdown is enabled in this component', () => {

      beforeEach(() => {
        comp.enableMarkdown = true;
        fixture.detectChanges();
      });

      it('should not use the Markdown Pipe', () => {
        expect(markdownSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('when markdown is enabled in the environment config', () => {
    beforeEach(() => {
      appConfig.markdown.enabled = true;
    });

    describe('and markdown is disabled in this component', () => {

      beforeEach(() => {
        comp.enableMarkdown = false;
        fixture.detectChanges();
      });

      it('should not use the Markdown Pipe', () => {
        expect(markdownSpy).not.toHaveBeenCalled();
      });
    });

    describe('and markdown is enabled in this component', () => {

      beforeEach(() => {
        comp.enableMarkdown = true;
        fixture.detectChanges();
      });

      it('should use the Markdown Pipe', () => {
        expect(markdownSpy).toHaveBeenCalled();
      });
    });

  });

  describe('test rendering of configured browse links', () => {
    beforeEach(() => {
      appConfig.markdown.enabled = false;
      comp.enableMarkdown = true;
      fixture.detectChanges();
    });

    it('should have a browse link', async () => {
      expect(fixture.debugElement.query(By.css('a.ds-browse-link')).nativeElement.innerHTML).toContain(mockValue);
    });
  });

  describe('test rendering of configured regex-based links', () => {
    beforeEach(() => {
      comp.urlRegex = '^test';
      fixture.detectChanges();
    });

    it('should have a rendered (non-browse) link since the value matches ^test', () => {
      expect(fixture.debugElement.query(By.css('a.ds-simple-metadata-link')).nativeElement.innerHTML).toContain(mockValue);
    });
  });

  describe('test skipping of configured links that do NOT match regex', () => {
    beforeEach(() => {
      comp.urlRegex = '^nope';
      fixture.detectChanges();
    });

    it('should NOT have a rendered (non-browse) link since the value matches ^test', () => {
      expect(fixture.debugElement.query(By.css('a.ds-simple-metadata-link'))).toBeNull();
    });
  });

  describe('picking the browse definition to link a metadata value to', () => {
    /**
     * Stands in for the stock DSpace config: a `subject` metadata browse over `dc.subject.*`, plus
     * the hierarchical browse DSpace auto-creates for the `srsc` vocabulary, whose metadata is the
     * `dc.subject` field the vocabulary is bound to in submission-forms.xml. `srsc` comes second,
     * as it does over REST.
     */
    const subjectBrowse = Object.assign(new ValueListBrowseDefinition(), {
      id: 'subject',
      metadataKeys: ['dc.subject.*'],
    });
    const srscBrowse = Object.assign(new HierarchicalBrowseDefinition(), {
      id: 'srsc',
      vocabulary: 'srsc',
      metadataKeys: ['dc.subject'],
    });

    const withDefinitions = (definitions: BrowseDefinition[]) => {
      (comp as any).browseService = {
        getBrowseDefinitions: () =>
          createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), definitions)),
      };
    };

    const resolve = (): { value: BrowseDefinition, emitted: boolean } => {
      const result = { value: undefined, emitted: false };
      comp.browseDefinition.subscribe((def: BrowseDefinition) => {
        result.value = def;
        result.emitted = true;
      });
      return result;
    };

    it('should use the metadata browse for an unqualified field covered by a ".*" spec', () => {
      comp.fields = ['dc.subject'];
      withDefinitions([subjectBrowse, srscBrowse]);

      const result = resolve();

      expect(result.emitted).toBeTrue();
      expect(result.value.id).toEqual('subject');
    });

    it('should not link to a hierarchical browse even when it is the only match', () => {
      comp.fields = ['dc.subject'];
      withDefinitions([srscBrowse]);

      const result = resolve();

      // nothing emitted -> the template falls back to plain text instead of linking into a
      // vocabulary tree that ignores startsWith
      expect(result.emitted).toBeFalse();
    });

    it('should still match a qualified field against a ".*" spec', () => {
      comp.fields = ['dc.subject.lcsh'];
      withDefinitions([subjectBrowse]);

      const result = resolve();

      expect(result.emitted).toBeTrue();
      expect(result.value.id).toEqual('subject');
    });
  });
});

export function mockItemWithMetadataFieldsAndValue(fields: string[], value: string): Item {
  const item = Object.assign(new Item(), {
    bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
    metadata: new MetadataMap(),
  });
  fields.forEach((field: string) => {
    item.metadata[field] = [{
      language: 'en_US',
      value: value,
    }] as MetadataValue[];
  });
  return item;
}
