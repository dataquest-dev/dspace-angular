import { BaseDataService } from '../core/data/base/base-data.service';
import { Bitstream } from '../core/shared/bitstream.model';
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

  it('should not nest the item below the primary bitstream', () => {
    expect(url).not.toContain('embed=bundle/primaryBitstream/item');
  });
});
