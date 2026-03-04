import { CommunityListElementComponent } from './community-list-element.component';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Community } from '../../../core/shared/community.model';
import { DSONameService } from '../../../core/breadcrumbs/dso-name.service';
import { DSONameServiceMock } from '../../mocks/dso-name.service.mock';
import { CommunityPathService } from '../../../core/services/community-path.service';
import { of } from 'rxjs';

let communityListElementComponent: CommunityListElementComponent;
let fixture: ComponentFixture<CommunityListElementComponent>;
let communityPathServiceSpy: jasmine.SpyObj<CommunityPathService>;

const mockCommunityWithAbstract: Community = Object.assign(new Community(), {
  metadata: {
    'dc.description.abstract': [
      {
        language: 'en_US',
        value: 'Short description'
      }
    ]
  }
});

const mockCommunityWithoutAbstract: Community = Object.assign(new Community(), {
  metadata: {
    'dc.title': [
      {
        language: 'en_US',
        value: 'Test title'
      }
    ]
  }
});

const mockCommunityWithParents: Community = Object.assign(new Community(), {
  metadata: {
    'dc.title': [
      {
        language: 'en_US',
        value: 'Child Community'
      }
    ]
  }
});

describe('CommunityListElementComponent', () => {
  beforeEach(waitForAsync(() => {
    const spy = jasmine.createSpyObj('CommunityPathService', ['getFullPath', 'hasParents']);

    TestBed.configureTestingModule({
      declarations: [CommunityListElementComponent],
      providers: [
        { provide: DSONameService, useValue: new DSONameServiceMock() },
        { provide: CommunityPathService, useValue: spy },
        { provide: 'objectElementProvider', useValue: (mockCommunityWithAbstract) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(CommunityListElementComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    }).compileComponents();

    communityPathServiceSpy = TestBed.inject(CommunityPathService) as jasmine.SpyObj<CommunityPathService>;
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(CommunityListElementComponent);
    communityListElementComponent = fixture.componentInstance;
  }));

  describe('When the community has an abstract', () => {
    beforeEach(() => {
      communityListElementComponent.object = mockCommunityWithAbstract;
      communityPathServiceSpy.getFullPath.and.returnValue(of('Test Community'));
      communityPathServiceSpy.hasParents.and.returnValue(of(false));
      fixture.detectChanges();
    });

    it('should show the description paragraph', () => {
      const communityAbstractField = fixture.debugElement.query(By.css('div.abstract-text'));
      expect(communityAbstractField).not.toBeNull();
    });
  });

  describe('When the community has no abstract', () => {
    beforeEach(() => {
      communityListElementComponent.object = mockCommunityWithoutAbstract;
      communityPathServiceSpy.getFullPath.and.returnValue(of('Test Community'));
      communityPathServiceSpy.hasParents.and.returnValue(of(false));
      fixture.detectChanges();
    });

    it('should not show the description paragraph', () => {
      const communityAbstractField = fixture.debugElement.query(By.css('div.abstract-text'));
      expect(communityAbstractField).toBeNull();
    });
  });

  describe('When the community has parent communities', () => {
    beforeEach(() => {
      communityListElementComponent.object = mockCommunityWithParents;
      communityPathServiceSpy.getFullPath.and.returnValue(of('Parent Community > Child Community'));
      communityPathServiceSpy.hasParents.and.returnValue(of(true));
      fixture.detectChanges();
    });

    it('should display the full path', () => {
      const communityNameField = fixture.debugElement.query(By.css('span.lead, a.lead'));
      expect(communityNameField.nativeElement.textContent.trim()).toContain('Parent Community > Child Community');
    });

    it('should call getFullPath service method', () => {
      expect(communityPathServiceSpy.getFullPath).toHaveBeenCalledWith(mockCommunityWithParents);
    });

    it('should call hasParents service method', () => {
      expect(communityPathServiceSpy.hasParents).toHaveBeenCalledWith(mockCommunityWithParents);
    });
  });

  describe('When the community has no parent communities', () => {
    beforeEach(() => {
      communityListElementComponent.object = mockCommunityWithoutAbstract;
      communityPathServiceSpy.getFullPath.and.returnValue(of('Test Community'));
      communityPathServiceSpy.hasParents.and.returnValue(of(false));
      fixture.detectChanges();
    });

    it('should display just the community name', () => {
      const communityNameField = fixture.debugElement.query(By.css('span.lead, a.lead'));
      expect(communityNameField.nativeElement.textContent.trim()).toContain('Mocked  ');
    });
  });
});
