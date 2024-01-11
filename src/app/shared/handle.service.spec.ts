<<<<<<< HEAD
import { HandleService } from './handle.service';
=======
import { HandleService, CANONICAL_PREFIX_KEY } from './handle.service';
import { TestBed } from '@angular/core/testing';
import { ConfigurationDataServiceStub } from './testing/configuration-data.service.stub';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { createSuccessfulRemoteDataObject$ } from './remote-data.utils';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
>>>>>>> dspace-7.6.1

describe('HandleService', () => {
  let service: HandleService;

<<<<<<< HEAD
  beforeEach(() => {
    service = new HandleService();
  });

  describe(`normalizeHandle`, () => {
    it(`should simply return an already normalized handle`, () => {
      let input, output;

      input = '123456789/123456';
      output = service.normalizeHandle(input);
      expect(output).toEqual(input);

      input = '12.3456.789/123456';
      output = service.normalizeHandle(input);
      expect(output).toEqual(input);
    });

    it(`should normalize a handle url`, () => {
      let input, output;

      input = 'https://hdl.handle.net/handle/123456789/123456';
      output = service.normalizeHandle(input);
      expect(output).toEqual('123456789/123456');

      input = 'https://rest.api/server/handle/123456789/123456';
      output = service.normalizeHandle(input);
      expect(output).toEqual('123456789/123456');
    });

    it(`should return null if the input doesn't contain a handle`, () => {
      let input, output;

      input = 'https://hdl.handle.net/handle/123456789';
      output = service.normalizeHandle(input);
      expect(output).toBeNull();

      input = 'something completely different';
      output = service.normalizeHandle(input);
      expect(output).toBeNull();
=======
  let configurationService: ConfigurationDataServiceStub;

  beforeEach(() => {
    configurationService = new ConfigurationDataServiceStub();

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigurationDataService, useValue: configurationService },
      ],
    });
    service = TestBed.inject(HandleService);
  });

  describe(`normalizeHandle`, () => {
    it('should normalize a handle url with custom conical prefix with trailing slash', (done: DoneFn) => {
      spyOn(configurationService, 'findByPropertyName').and.returnValue(createSuccessfulRemoteDataObject$({
        ... new ConfigurationProperty(),
        name: CANONICAL_PREFIX_KEY,
        values: ['https://hdl.handle.net/'],
      }));

      service.normalizeHandle('https://hdl.handle.net/123456789/123456').subscribe((handle: string | null) => {
        expect(handle).toBe('123456789/123456');
        done();
      });
    });

    it('should normalize a handle url with custom conical prefix without trailing slash', (done: DoneFn) => {
      spyOn(configurationService, 'findByPropertyName').and.returnValue(createSuccessfulRemoteDataObject$({
        ... new ConfigurationProperty(),
        name: CANONICAL_PREFIX_KEY,
        values: ['https://hdl.handle.net/'],
      }));

      service.normalizeHandle('https://hdl.handle.net/123456789/123456').subscribe((handle: string | null) => {
        expect(handle).toBe('123456789/123456');
        done();
      });
    });

    describe('should simply return an already normalized handle', () => {
      it('123456789/123456', (done: DoneFn) => {
        service.normalizeHandle('123456789/123456').subscribe((handle: string | null) => {
          expect(handle).toBe('123456789/123456');
          done();
        });
      });

      it('12.3456.789/123456', (done: DoneFn) => {
        service.normalizeHandle('12.3456.789/123456').subscribe((handle: string | null) => {
          expect(handle).toBe('12.3456.789/123456');
          done();
        });
      });
    });

    it('should normalize handle urls starting with handle', (done: DoneFn) => {
      service.normalizeHandle('https://rest.api/server/handle/123456789/123456').subscribe((handle: string | null) => {
        expect(handle).toBe('123456789/123456');
        done();
      });
    });

    it('should return null if the input doesn\'t contain a valid handle', (done: DoneFn) => {
      service.normalizeHandle('https://hdl.handle.net/123456789').subscribe((handle: string | null) => {
        expect(handle).toBeNull();
        done();
      });
    });

    it('should return null if the input doesn\'t contain a handle', (done: DoneFn) => {
      service.normalizeHandle('something completely different').subscribe((handle: string | null) => {
        expect(handle).toBeNull();
        done();
      });
>>>>>>> dspace-7.6.1
    });
  });
});
