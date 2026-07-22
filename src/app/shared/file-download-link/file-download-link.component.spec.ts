import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FileDownloadLinkComponent } from './file-download-link.component';
import { Bitstream } from '../../core/shared/bitstream.model';
import { By } from '@angular/platform-browser';
import { URLCombiner } from '../../core/url-combiner/url-combiner';
import { getBitstreamModuleRoute } from '../../app-routing-paths';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { cold, getTestScheduler } from 'jasmine-marbles';
import { Item } from '../../core/shared/item.model';
import { RouterLinkDirectiveStub } from '../testing/router-link-directive.stub';
import { TranslateModule } from '@ngx-translate/core';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';

describe('FileDownloadLinkComponent', () => {
  let component: FileDownloadLinkComponent;
  let fixture: ComponentFixture<FileDownloadLinkComponent>;

  let scheduler;
  let authorizationService: AuthorizationDataService;
  let dsoNameService: DSONameService;

  const bitstreamName = 'Test bitstream name';

  let bitstream: Bitstream;
  let item: Item;

  function init() {
    authorizationService = jasmine.createSpyObj('authorizationService', {
      isAuthorized: cold('-a', {a: true})
    });
    dsoNameService = jasmine.createSpyObj('dsoNameService', {
      getName: bitstreamName
    });
    bitstream = Object.assign(new Bitstream(), {
      uuid: 'bitstreamUuid',
      _links: {
        self: {href: 'obj-selflink'}
      }
    });
    item = Object.assign(new Item(), {
      uuid: 'itemUuid',
      _links: {
        self: {href: 'obj-selflink'}
      }
    });
  }

  function initTestbed() {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
      ],
      declarations: [FileDownloadLinkComponent, RouterLinkDirectiveStub],
      providers: [
        {provide: AuthorizationDataService, useValue: authorizationService},
        {provide: DSONameService, useValue: dsoNameService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  }

  describe('init', () => {
    describe('getBitstreamPath', () => {
      describe('when the user has download rights', () => {
        beforeEach(waitForAsync(() => {
          scheduler = getTestScheduler();
          init();
          initTestbed();
        }));

        beforeEach(() => {
          fixture = TestBed.createComponent(FileDownloadLinkComponent);
          component = fixture.componentInstance;
          component.bitstream = bitstream;
          component.item = item;
          fixture.detectChanges();
        });
        it('should return the bitstreamPath based on the input bitstream', () => {
          expect(component.bitstreamPath$).toBeObservable(cold('-a', {a: { routerLink: new URLCombiner(getBitstreamModuleRoute(), bitstream.uuid, 'download').toString(), queryParams: {} }}));
          expect(component.canDownload$).toBeObservable(cold('--a', {a: true}));

        });
        it('should init the component', () => {
          scheduler.flush();
          fixture.detectChanges();
          const link = fixture.debugElement.query(By.css('a'));
          expect(link.injector.get(RouterLinkDirectiveStub).routerLink).toContain(new URLCombiner(getBitstreamModuleRoute(), bitstream.uuid, 'download').toString());
          const lock = fixture.debugElement.query(By.css('.fa-lock'));
          expect(lock).toBeNull();
        });
        it('should set an accessible aria-label on the download link containing the bitstream name', () => {
          scheduler.flush();
          fixture.detectChanges();
          const link = fixture.debugElement.query(By.css('a'));
          expect(link.nativeElement.getAttribute('aria-label')).toContain(bitstreamName);
        });
        it('should not include the restricted-bitstream text in the aria-label', () => {
          scheduler.flush();
          fixture.detectChanges();
          const link = fixture.debugElement.query(By.css('a'));
          expect(link.nativeElement.getAttribute('aria-label')).not.toContain('file-download-link.restricted');
        });
      });
      // describe('when the user has no download rights but has the right to request a copy', () => {
      //   beforeEach(waitForAsync(() => {
      //     scheduler = getTestScheduler();
      //     init();
      //     (authorizationService.isAuthorized as jasmine.Spy).and.callFake((featureId, object) => {
      //       if (featureId === FeatureID.CanDownload) {
      //         return cold('-a', {a: false});
      //       }
      //       return cold('-a', {a: true});
      //     });
      //     initTestbed();
      //   }));
      //   beforeEach(() => {
      //     fixture = TestBed.createComponent(FileDownloadLinkComponent);
      //     component = fixture.componentInstance;
      //     component.item = item;
      //     component.bitstream = bitstream;
      //     fixture.detectChanges();
      //   });
      //   it('should return the bitstreamPath based on the input bitstream', () => {
      //     expect(component.bitstreamPath$).toBeObservable(cold('-a', {a: { routerLink: new URLCombiner(getItemModuleRoute(), item.uuid, 'request-a-copy').toString(), queryParams: { bitstream: bitstream.uuid } }}));
      //     expect(component.canDownload$).toBeObservable(cold('--a', {a: false}));
      //
      //   });
      //   it('should init the component', () => {
      //     scheduler.flush();
      //     fixture.detectChanges();
      //     const link = fixture.debugElement.query(By.css('a'));
      //     expect(link.injector.get(RouterLinkDirectiveStub).routerLink).toContain(new URLCombiner(getItemModuleRoute(), item.uuid, 'request-a-copy').toString());
      //     const lock = fixture.debugElement.query(By.css('.fa-lock')).nativeElement;
      //     expect(lock).toBeTruthy();
      //   });
      // });
      describe('when the user has no download rights and no request a copy rights', () => {
        beforeEach(waitForAsync(() => {
          scheduler = getTestScheduler();
          init();
          (authorizationService.isAuthorized as jasmine.Spy).and.returnValue(cold('-a', {a: false}));
          initTestbed();
        }));
        beforeEach(() => {
          fixture = TestBed.createComponent(FileDownloadLinkComponent);
          component = fixture.componentInstance;
          component.bitstream = bitstream;
          component.item = item;
          fixture.detectChanges();
        });
        it('should return the bitstreamPath based on the input bitstream', () => {
          expect(component.bitstreamPath$).toBeObservable(cold('-a', {a: { routerLink: new URLCombiner(getBitstreamModuleRoute(), bitstream.uuid, 'download').toString(), queryParams: {} }}));
          expect(component.canDownload$).toBeObservable(cold('--a', {a: false}));

        });
        it('should init the component', () => {
          scheduler.flush();
          fixture.detectChanges();
          const link = fixture.debugElement.query(By.css('a'));
          expect(link.injector.get(RouterLinkDirectiveStub).routerLink).toContain(new URLCombiner(getBitstreamModuleRoute(), bitstream.uuid, 'download').toString());
          const lock = fixture.debugElement.query(By.css('.fa-lock')).nativeElement;
          expect(lock).toBeTruthy();
        });
        it('should mark the lock icon as decorative and expose the restricted state via the link\'s own aria-label', () => {
          scheduler.flush();
          fixture.detectChanges();
          const lock = fixture.debugElement.query(By.css('.fa-lock')).nativeElement;
          expect(lock.getAttribute('aria-hidden')).toBe('true');
          // The restricted state must be part of the link's own aria-label: an element's
          // aria-label overrides its accessible-name computation entirely, so a nested
          // sr-only text node would never be announced (this is the bug the fix corrects).
          const link = fixture.debugElement.query(By.css('a'));
          expect(link.nativeElement.getAttribute('aria-label')).toContain('file-download-link.restricted');
        });
      });
    });
  });
});
