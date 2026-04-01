import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { Context } from '../../core/shared/context.model';
import {
  MetadataRepresentation,
  MetadataRepresentationType
} from '../../core/shared/metadata-representation/metadata-representation.model';
import { PlainTextMetadataListElementComponent } from '../object-list/metadata-representation-list-element/plain-text/plain-text-metadata-list-element.component';
import { createSuccessfulRemoteDataObject$ } from '../remote-data.utils';
import { ThemeService } from '../theme-support/theme.service';
import { METADATA_REPRESENTATION_COMPONENT_FACTORY } from './metadata-representation.decorator';
import { MetadataRepresentationLoaderComponent } from './metadata-representation-loader.component';
import { MetadataRepresentationDirective } from './metadata-representation.directive';

const testType = 'TestType';
const testContext = Context.Search;
const testRepresentationType = MetadataRepresentationType.Item;
    themeService = jasmine.createSpyObj('themeService', { getThemeName: themeName });
    return testType;
  }

  get representationType(): MetadataRepresentationType {
    return testRepresentationType;
  }

  getValue(): string {
    return '';
  }
}

        },
  const themeName = 'test-theme';

  beforeEach(waitForAsync(() => {
    themeService = jasmine.createSpyObj('themeService', {
      getThemeName: themeName,
    });
    TestBed.configureTestingModule({
      imports: [],
      declarations: [MetadataRepresentationLoaderComponent, PlainTextMetadataListElementComponent, MetadataRepresentationDirective],
      providers: [
        {
          provide: METADATA_REPRESENTATION_COMPONENT_FACTORY,
          useValue: jasmine.createSpy('getMetadataRepresentationComponent').and.returnValue(PlainTextMetadataListElementComponent)
        },
        {
          provide: ThemeService,
          useValue: themeService,
<<<<<<< HEAD
        }
      ]
=======
        },
        {
          provide: ConfigurationDataService,
          useValue: {
            findByPropertyName: jasmine.createSpy('findByPropertyName').and.returnValue(
              createSuccessfulRemoteDataObject$({ values: ['https://orcid.org'] }),
            ),
          },
        },
      ],
>>>>>>> fea2f20fb2 (MENDELU/ORCID hyperlinks (#1271))
    }).overrideComponent(MetadataRepresentationLoaderComponent, {
      set: {
        changeDetection: ChangeDetectionStrategy.Default,
        entryComponents: [PlainTextMetadataListElementComponent]
      }
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MetadataRepresentationLoaderComponent);
    comp = fixture.componentInstance;

    comp.mdRepresentation = new TestType();
    comp.context = testContext;
    fixture.detectChanges();
  }));

  describe('When the component is rendered', () => {
    it('should call the getMetadataRepresentationComponent function with the right entity type, representation type and context', () => {
      expect((comp as any).getMetadataRepresentationComponent).toHaveBeenCalledWith(testType, testRepresentationType, testContext, themeName);
    });
  });
});
