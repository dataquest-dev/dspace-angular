/* eslint-disable max-classes-per-file */
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { APP_DATA_SERVICES_MAP } from '../../config/app-config.interface';
import { LinkService } from '../core/cache/builders/link.service';
import { BaseDataService } from '../core/data/base/base-data.service';
import { Bitstream } from '../core/shared/bitstream.model';
import { Bundle } from '../core/shared/bundle.model';
import { Item } from '../core/shared/item.model';
import { getFirstSucceededRemoteDataPayload } from '../core/shared/operators';
import { hasValue } from '../shared/empty.util';
import { createSuccessfulRemoteDataObject$ } from '../shared/remote-data.utils';
import { FollowLinkConfig } from '../shared/utils/follow-link-config.model';
import { BITSTREAM_PAGE_LINKS_TO_FOLLOW } from './bitstream-page.resolver';

/**
 * buildHrefFromFindOptions is public on BaseDataService, but the class is only ever used through a
 * concrete data service, so the spec subclasses it the way base-data.service.spec.ts does.
 */
class TestService extends BaseDataService<Bitstream> {
  constructor() {
    super(undefined, undefined, undefined, undefined, undefined);
  }
}

describe('BITSTREAM_PAGE_LINKS_TO_FOLLOW', () => {
  const href = 'https://rest.api/bitstreams/id';

  let service: TestService;
  let url: string;

  beforeEach(() => {
    service = new TestService();
    // URLCombiner percent-encodes the embed separator, so read the query back decoded
    url = decodeURIComponent(service.buildHrefFromFindOptions(href, {}, [], ...BITSTREAM_PAGE_LINKS_TO_FOLLOW));
  });

  it('should embed the item of the bundle', () => {
    expect(url).toContain('embed=bundle/item');
  });

  it('should embed the primary bitstream and the item of the bundle next to each other', () => {
    expect(new URL(url).searchParams.getAll('embed')).toEqual(['bundle/primaryBitstream', 'bundle/item', 'format']);
  });

  it('should not nest the item below the primary bitstream', () => {
    expect(url).not.toContain('embed=bundle/primaryBitstream/item');
  });
});

describe('BITSTREAM_PAGE_LINKS_TO_FOLLOW resolved by the LinkService', () => {
  let linkService: LinkService;
  let bitstream: Bitstream;

  const models = {
    bundle: () => Object.assign(new Bundle(), {
      _links: { self: { href: 'bundle' }, item: { href: 'item' }, primaryBitstream: { href: 'primaryBitstream' } },
    }),
    item: () => Object.assign(new Item(), { uuid: 'item-uuid', _links: { self: { href: 'item' } } }),
    primaryBitstream: () => Object.assign(new Bitstream(), { uuid: 'primary-uuid', _links: { self: { href: 'primaryBitstream' } } }),
  };

  /**
   * Answers every findByHref with a fresh model and resolves its links, like RemoteDataBuildService does
   */
  class FakeDataService {
    findByHref(link: string, useCachedVersionIfAvailable: boolean, reRequestOnStale: boolean, ...linksToFollow: FollowLinkConfig<any>[]) {
      return createSuccessfulRemoteDataObject$(linkService.resolveLinks(models[link](), ...linksToFollow));
    }
  }

  beforeEach(() => {
    const dataServices: any = new Map(
      ['bundle', 'item', 'bitstream'].map((type) => [type, () => Promise.resolve(FakeDataService)]),
    );
    TestBed.configureTestingModule({
      providers: [
        FakeDataService,
        { provide: APP_DATA_SERVICES_MAP, useValue: dataServices },
      ],
    });
    linkService = TestBed.inject(LinkService);

    bitstream = Object.assign(new Bitstream(), {
      _links: { self: { href: 'bitstream' }, bundle: { href: 'bundle' }, format: { href: 'format' } },
    });
    linkService.resolveLinks(bitstream, ...BITSTREAM_PAGE_LINKS_TO_FOLLOW);
  });

  it('should resolve the item of the bundle', (done) => {
    bitstream.bundle.pipe(
      getFirstSucceededRemoteDataPayload(),
      switchMap((bundle: Bundle) => hasValue(bundle.item) ? bundle.item.pipe(getFirstSucceededRemoteDataPayload()) : of(undefined)),
    ).subscribe((item: Item) => {
      expect(item?.uuid).toBe('item-uuid');
      done();
    });
  });

  it('should resolve the primary bitstream of the bundle', (done) => {
    bitstream.bundle.pipe(
      getFirstSucceededRemoteDataPayload(),
      switchMap((bundle: Bundle) => hasValue(bundle.primaryBitstream) ? bundle.primaryBitstream.pipe(getFirstSucceededRemoteDataPayload()) : of(undefined)),
    ).subscribe((primaryBitstream: Bitstream) => {
      expect(primaryBitstream?.uuid).toBe('primary-uuid');
      done();
    });
  });
});
