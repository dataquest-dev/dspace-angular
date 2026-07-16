import {
  autoserialize,
  deserialize,
} from 'cerialize';
import { ListableObject } from 'src/app/shared/object-collection/shared/listable-object.model';

import { typedObject } from '../../cache/builders/build-decorators';
import { CacheableObject } from '../../cache/cacheable-object.model';
import { GenericConstructor } from '../../shared/generic-constructor';
import { HALLink } from '../../shared/hal-link.model';
import { ResourceType } from '../../shared/resource-type';
import { excludeFromEquals } from '../../utilities/equals.decorators';
import { EPIC_HANDLE } from '../epic-handle.resource-type';

@typedObject
export class EpicHandle extends ListableObject implements CacheableObject {
  static type = EPIC_HANDLE;

  @excludeFromEquals
  @autoserialize
  type: ResourceType;

  @autoserialize
  id: string;

  @autoserialize
  url: string;

  @deserialize
  _links: {
    self: HALLink
  };

  getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
    return [this.constructor as GenericConstructor<ListableObject>];
  }

}
