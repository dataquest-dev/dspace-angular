import { Item } from '../../../../../core/shared/item.model';
import { Bitstream } from '../../../../../core/shared/bitstream.model';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TruncatePipe } from '../../../../utils/truncate.pipe';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AccessStatusBadgeComponent } from './access-status-badge.component';
import { createSuccessfulRemoteDataObject$ } from '../../../../remote-data.utils';
import { By } from '@angular/platform-browser';
import { AccessStatusObject } from './access-status.model';
import { LinkService } from 'src/app/core/cache/builders/link.service';
import { environment } from 'src/environments/environment';
import { EMPTY } from 'rxjs';

describe('AccessStatusBadgeComponent', () => {
  let component: AccessStatusBadgeComponent;
  let fixture: ComponentFixture<AccessStatusBadgeComponent>;

  let unknownStatus: AccessStatusObject;
  let metadataOnlyStatus: AccessStatusObject;
  let openAccessStatus: AccessStatusObject;
  let embargoStatus: AccessStatusObject;
  let restrictedStatus: AccessStatusObject;

  let linkService: LinkService;

  let item: Item;
  let bitstream: Bitstream;

  function init() {
    unknownStatus = Object.assign(new AccessStatusObject(), {
      status: 'unknown'
    });

    metadataOnlyStatus = Object.assign(new AccessStatusObject(), {
      status: 'metadata.only'
    });

    openAccessStatus = Object.assign(new AccessStatusObject(), {
      status: 'open.access'
    });

    embargoStatus = Object.assign(new AccessStatusObject(), {
      status: 'embargo',
      embargoDate: '2050-01-01'
    });

    restrictedStatus = Object.assign(new AccessStatusObject(), {
      status: 'restricted'
    });

    linkService = jasmine.createSpyObj('linkService', ['resolveLink']);
    // Mirror LinkService.resolveLink's real behavior for a missing + optional link:
    // it synchronously attaches EMPTY to the model rather than leaving it undefined
    // (and never touches _links.accessStatus directly - see link.service.ts).
    (linkService.resolveLink as jasmine.Spy).and.callFake((model: any, linkToFollow: any) => {
      model[linkToFollow.name] = EMPTY;
      return model;
    });

    item = Object.assign(new Item(), {
      uuid: 'item-uuid',
      type: 'item',
      accessStatus: createSuccessfulRemoteDataObject$(unknownStatus)
    });

    // A bitstream as it looks BEFORE the backend exposes the accessStatus link
    // (i.e. today, on this branch's target backend): no accessStatus key in
    // _links, and the accessStatus property itself never populated.
    bitstream = Object.assign(new Bitstream(), {
      uuid: 'bitstream-uuid',
      type: 'bitstream',
      _links: {
        self: { href: 'obj-selflink' }
      }
    });
  }

  function initTestBed() {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [AccessStatusBadgeComponent, TruncatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: LinkService, useValue: linkService }
      ]
    }).compileComponents();
  }

  function initFixtureAndComponent(object: Item | Bitstream) {
    environment.item.showAccessStatuses = true;
    environment.item.bitstream.showAccessStatuses = true;
    fixture = TestBed.createComponent(AccessStatusBadgeComponent);
    component = fixture.componentInstance;
    component.object = object;
    fixture.detectChanges();
    environment.item.showAccessStatuses = false;
    environment.item.bitstream.showAccessStatuses = false;
  }

  function lookForAccessStatusBadge(status: string) {
    const badge = fixture.debugElement.query(By.css('span.badge'));
    expect(badge.nativeElement.textContent).toEqual(`access-status.${status.toLowerCase()}.listelement.badge`);
  }

  describe('init', () => {
    beforeEach(waitForAsync(() => {
      init();
      initTestBed();
    }));
    beforeEach(() => {
      initFixtureAndComponent(item);
    });
    it('should init the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('for an Item', () => {
    describe('when the access status is unknown', () => {
      beforeEach(waitForAsync(() => {
        init();
        initTestBed();
      }));
      beforeEach(() => {
        initFixtureAndComponent(item);
      });
      it('should show the unknown badge', () => {
        lookForAccessStatusBadge('unknown');
      });
    });

    describe('when the access status is metadata.only', () => {
      beforeEach(waitForAsync(() => {
        init();
        item.accessStatus = createSuccessfulRemoteDataObject$(metadataOnlyStatus);
        initTestBed();
      }));
      beforeEach(() => {
        initFixtureAndComponent(item);
      });
      it('should show the metadata only badge', () => {
        lookForAccessStatusBadge('metadata.only');
      });
    });

    describe('when the access status is open.access', () => {
      beforeEach(waitForAsync(() => {
        init();
        item.accessStatus = createSuccessfulRemoteDataObject$(openAccessStatus);
        initTestBed();
      }));
      beforeEach(() => {
        initFixtureAndComponent(item);
      });
      it('should show the open access badge', () => {
        lookForAccessStatusBadge('open.access');
      });
    });

    describe('when the access status is embargo', () => {
      beforeEach(waitForAsync(() => {
        init();
        item.accessStatus = createSuccessfulRemoteDataObject$(embargoStatus);
        initTestBed();
      }));
      beforeEach(() => {
        initFixtureAndComponent(item);
      });
      it('should show the embargo badge', () => {
        lookForAccessStatusBadge('embargo');
      });
    });

    describe('when the access status is restricted', () => {
      beforeEach(waitForAsync(() => {
        init();
        item.accessStatus = createSuccessfulRemoteDataObject$(restrictedStatus);
        initTestBed();
      }));
      beforeEach(() => {
        initFixtureAndComponent(item);
      });
      it('should show the restricted badge', () => {
        lookForAccessStatusBadge('restricted');
      });
    });
  });

  describe('for a Bitstream', () => {
    describe('when the bitstream is embargoed', () => {
      beforeEach(waitForAsync(() => {
        init();
        bitstream.accessStatus = createSuccessfulRemoteDataObject$(embargoStatus);
        initTestBed();
      }));
      beforeEach(() => {
        initFixtureAndComponent(bitstream);
      });
      it('should show the embargo badge with the embargo date', () => {
        const badge = fixture.debugElement.query(By.css('span.badge'));
        expect(badge.nativeElement.textContent).toContain('embargo.listelement.badge');
      });
    });

    describe('when the bitstream is open access (no embargo date)', () => {
      beforeEach(waitForAsync(() => {
        init();
        bitstream.accessStatus = createSuccessfulRemoteDataObject$(openAccessStatus);
        initTestBed();
      }));
      beforeEach(() => {
        initFixtureAndComponent(bitstream);
      });
      it('should not show a badge', () => {
        const badge = fixture.debugElement.query(By.css('span.badge'));
        expect(badge).toBeNull();
      });
    });

    describe('when the backend does not expose the accessStatus link yet (pre-DSpace#1377)', () => {
      // Regression test: findBitstreamAccessStatusFor() used to read
      // bitstream._links.accessStatus.href synchronously, which threw a
      // TypeError (uncaught by any catchError, since it happened before the
      // Observable pipe was even constructed) and broke the whole file-list
      // render. The component must now fail closed instead: no crash, no
      // badge, using a bitstream that has NO accessStatus link and NO
      // pre-resolved accessStatus property, exactly like a real bitstream
      // from this branch's current (pre-backend-PR) REST API.
      beforeEach(waitForAsync(() => {
        init();
        initTestBed();
      }));

      it('should not throw when initializing with a bitstream lacking the accessStatus link', () => {
        expect(() => initFixtureAndComponent(bitstream)).not.toThrow();
      });

      it('should render the file list without a badge', () => {
        initFixtureAndComponent(bitstream);
        const badge = fixture.debugElement.query(By.css('span.badge'));
        expect(badge).toBeNull();
      });

      it('should ask the LinkService to resolve the link as optional', () => {
        initFixtureAndComponent(bitstream);
        expect(linkService.resolveLink).toHaveBeenCalledWith(
          bitstream,
          jasmine.objectContaining({ name: 'accessStatus', isOptional: true }),
        );
      });
    });
  });
});
