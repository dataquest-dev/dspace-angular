import { typedObject } from '../../cache/builders/build-decorators';
import { HALResource } from '../hal-resource.model';
import { excludeFromEquals } from '../../utilities/equals.decorators';
import { autoserialize, deserialize } from 'cerialize';
import { ResourceType } from '../resource-type';
import { HALLink } from '../hal-link.model';
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
