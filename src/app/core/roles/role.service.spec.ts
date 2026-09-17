import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CollectionDataService } from '../data/collection-data.service';
import { RoleService } from './role.service';
import { RoleType } from './role-types';

describe('RoleService', () => {
  let service: RoleService;
  let collectionService: jasmine.SpyObj<CollectionDataService>;

  beforeEach(() => {
    collectionService = jasmine.createSpyObj('CollectionDataService', {
      hasAuthorizedCollection: of(false),
    });

    TestBed.configureTestingModule({
      providers: [
        RoleService,
        { provide: CollectionDataService, useValue: collectionService },
      ],
    });

    service = TestBed.inject(RoleService);
  });

  describe('isSubmitter', () => {
    it('should emit true', (done) => {
      service.isSubmitter().subscribe((isSubmitter: boolean) => {
        expect(isSubmitter).toBe(true);
        done();
      });
    });

    it('should not ask the REST API whether the user has an authorized collection', (done) => {
      service.isSubmitter().subscribe(() => {
        expect(collectionService.hasAuthorizedCollection).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('checkRole', () => {
    it('should emit true for the submitter role', (done) => {
      service.checkRole(RoleType.Submitter).subscribe((hasRole: boolean) => {
        expect(hasRole).toBe(true);
        done();
      });
    });
  });
});
