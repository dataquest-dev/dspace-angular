import {
  autoserialize,
  deserialize,
} from 'cerialize';

import { typedObject } from '../../cache/builders/build-decorators';
import { excludeFromEquals } from '../../utilities/equals.decorators';
import { HALLink } from '../hal-link.model';
import { HALResource } from '../hal-resource.model';
import { ResourceType } from '../resource-type';
import { MATOMO_REPORT_SUBSCRIPTION } from './matomo-report-subscription.resource-type';

@typedObject
export class MatomoReportSubscription implements HALResource {
  static type = MATOMO_REPORT_SUBSCRIPTION;

  @excludeFromEquals
  @autoserialize
  type: ResourceType;

  @autoserialize
  id: number;

  @autoserialize
  epersonId: string;

  @autoserialize
  itemId: string;

  @deserialize
  _links: {
    self: HALLink;
  };
}
