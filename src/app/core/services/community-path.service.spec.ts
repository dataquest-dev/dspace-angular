import { TestBed } from '@angular/core/testing';
import { CommunityPathService } from './community-path.service';
import { DSONameService } from '../breadcrumbs/dso-name.service';
import { Community } from '../shared/community.model';
import { RemoteData } from '../data/remote-data';
import { of, throwError } from 'rxjs';
import { MetadataValue } from '../shared/metadata.models';
import { createSuccessfulRemoteDataObject } from '../../shared/remote-data.utils';

describe('CommunityPathService', () => {
  let service: CommunityPathService;
  let dsoNameServiceSpy: jasmine.SpyObj<DSONameService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DSONameService', ['getName']);

    TestBed.configureTestingModule({
      providers: [
        CommunityPathService,
        { provide: DSONameService, useValue: spy }
      ]
    });
    service = TestBed.inject(CommunityPathService);
    dsoNameServiceSpy = TestBed.inject(DSONameService) as jasmine.SpyObj<DSONameService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFullPath', () => {
    it('should return single community name when no parent exists', (done) => {
      const community = new Community();
      community.metadata = {
        'dc.title': [Object.assign(new MetadataValue(), { value: 'Test Community' })]
      };
      community.parentCommunity = undefined;

      dsoNameServiceSpy.getName.and.returnValue('Test Community');

      service.getFullPath(community).subscribe(path => {
        expect(path).toBe('Test Community');
        done();
      });
    });

    it('should return full path with parent communities', (done) => {
      // Create parent community
      const parentCommunity = new Community();
      parentCommunity.metadata = {
        'dc.title': [Object.assign(new MetadataValue(), { value: 'Parent Community' })]
      };
      parentCommunity.parentCommunity = undefined;

      // Create child community
      const childCommunity = new Community();
      childCommunity.metadata = {
        'dc.title': [Object.assign(new MetadataValue(), { value: 'Child Community' })]
      };
      childCommunity.parentCommunity = of(createSuccessfulRemoteDataObject(parentCommunity));

      dsoNameServiceSpy.getName.and.callFake((community) => {
        if (community === parentCommunity) return 'Parent Community';
        if (community === childCommunity) return 'Child Community';
        return '';
      });

      service.getFullPath(childCommunity).subscribe(path => {
        expect(path).toBe('Parent Community > Child Community');
        done();
      });
    });

    it('should handle errors gracefully', (done) => {
      const community = new Community();
      community.metadata = {
        'dc.title': [Object.assign(new MetadataValue(), { value: 'Test Community' })]
      };
      community.parentCommunity = throwError('Error loading parent');

      dsoNameServiceSpy.getName.and.returnValue('Test Community');

      service.getFullPath(community).subscribe(path => {
        expect(path).toBe('Test Community');
        done();
      });
    });
  });

  describe('hasParents', () => {
    it('should return false when no parent exists', (done) => {
      const community = new Community();
      community.parentCommunity = undefined;

      service.hasParents(community).subscribe(hasParents => {
        expect(hasParents).toBe(false);
        done();
      });
    });

    it('should return true when parent exists and is successful', (done) => {
      const parentCommunity = new Community();
      const community = new Community();
      community.parentCommunity = of(createSuccessfulRemoteDataObject(parentCommunity));

      service.hasParents(community).subscribe(hasParents => {
        expect(hasParents).toBe(true);
        done();
      });
    });

    it('should return false when parent load fails', (done) => {
      const community = new Community();
      community.parentCommunity = throwError('Error loading parent');

      service.hasParents(community).subscribe(hasParents => {
        expect(hasParents).toBe(false);
        done();
      });
    });
  });
});