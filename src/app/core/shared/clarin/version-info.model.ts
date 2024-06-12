import { typedObject } from '../../cache/builders/build-decorators';
import { HALResource } from '../hal-resource.model';
import { HALLink } from '../hal-link.model';
import { autoserialize, deserialize } from 'cerialize';
import { VERSION_INFO } from './version-info.resource-type';
import { excludeFromEquals } from '../../utilities/equals.decorators';
import { ResourceType } from '../resource-type';

@typedObject
export class VersionInfo implements HALResource {
  /**
   * The `versioninfo` object type.
   */
  static type = VERSION_INFO;

  @excludeFromEquals
  @autoserialize
  type: ResourceType;

  @autoserialize
  commitHash: string;

  @autoserialize
  date: string;

  @autoserialize
  buildRunUrl: string;

  /**
   * The {@link HALLink}s for this Clarin License
   */
  @deserialize
  _links: {
    self: HALLink
  };

}
