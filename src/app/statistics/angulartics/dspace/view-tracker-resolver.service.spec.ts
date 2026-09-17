import { ResolveEnd } from '@angular/router';
import { of } from 'rxjs';

import { ViewTrackerResolverService } from './view-tracker-resolver.service';

describe('ViewTrackerResolverService', () => {
  const handle = 'https://hdl.handle.net/123456789/1';
  let service: ViewTrackerResolverService;
  let angulartics2;
  let item;

  beforeEach(() => {
    angulartics2 = { eventTrack: jasmine.createSpyObj('eventTrack', ['next']) };
    item = { firstMetadataValue: (key: string) => key === 'dc.identifier.uri' ? handle : undefined };
    const router = { events: of(new ResolveEnd(1, '/items/uuid', '/items/uuid', null)) } as any;
    const referrerService = { getReferrer: () => of('https://www.referrer.com') } as any;
    service = new ViewTrackerResolverService(angulartics2, referrerService, router);
  });

  it('should report the item handle along with the tracked object', () => {
    service.resolve({ data: { dso: { payload: item } } } as any, null);

    expect(angulartics2.eventTrack.next).toHaveBeenCalledWith({
      action: 'page_view',
      properties: {
        object: item,
        referrer: 'https://www.referrer.com',
        dc_identifier: handle,
      },
    });
  });

  it('should report no handle for an object that has none', () => {
    service.resolve({ data: { dso: { payload: {} } } } as any, null);

    expect(angulartics2.eventTrack.next).toHaveBeenCalledWith({
      action: 'page_view',
      properties: {
        object: {},
        referrer: 'https://www.referrer.com',
        dc_identifier: undefined,
      },
    });
  });
});
