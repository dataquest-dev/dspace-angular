import { Angulartics2 } from 'angulartics2';
import { of } from 'rxjs';
import { filter } from 'rxjs/operators';

import { MatomoService } from '../matomo.service';
import { StatisticsService } from '../statistics.service';
import { Angulartics2DSpace } from './dspace-provider';

describe('Angulartics2DSpace', () => {
  let provider: Angulartics2DSpace;
  let angulartics2: Angulartics2;
  let statisticsService: jasmine.SpyObj<StatisticsService>;
  let matomoService: jasmine.SpyObj<MatomoService>;

  beforeEach(() => {
    angulartics2 = {
      eventTrack: of({ action: 'page_view', properties: {
        object: 'mock-object',
        referrer: 'https://www.referrer.com',
        dc_identifier: 'https://hdl.handle.net/123456789/1',
      } }),
      filterDeveloperMode: () => filter(() => true),
    } as any;
    statisticsService = jasmine.createSpyObj('statisticsService', { trackViewEvent: null });
    matomoService = jasmine.createSpyObj('matomoService', { setItemHandle: null });
    provider = new Angulartics2DSpace(angulartics2, statisticsService, matomoService);
  });

  it('should use the statisticsService', () => {
    provider.startTracking();
    expect(statisticsService.trackViewEvent).toHaveBeenCalledWith('mock-object' as any, 'https://www.referrer.com');
  });

  it('should hand the item handle to the matomo service', () => {
    provider.startTracking();
    expect(matomoService.setItemHandle).toHaveBeenCalledWith('https://hdl.handle.net/123456789/1');
  });

});
