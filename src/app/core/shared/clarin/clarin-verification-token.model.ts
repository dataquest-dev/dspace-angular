import {typedObject} from '../../cache/builders/build-decorators';
import {ListableObject} from '../../../shared/object-collection/shared/listable-object.model';
import {HALResource} from '../hal-resource.model';
import {CLARIN_LICENSE} from './clarin-license.resource-type';
import {excludeFromEquals} from '../../utilities/equals.decorators';
import {autoserialize, autoserializeAs, deserialize} from 'cerialize';
import {ResourceType} from '../resource-type';
import {ClarinLicenseConfirmationSerializer} from './clarin-license-confirmation-serializer';
import {ClarinLicenseRequiredInfoSerializer} from './clarin-license-required-info-serializer';
import {ClarinLicenseLabel} from './clarin-license-label.model';
import {HALLink} from '../hal-link.model';
import {GenericConstructor} from '../generic-constructor';
import {CLARIN_VERIFICATION_TOKEN} from './clarin-verification-token.resource-type';

@typedObject
export class ClarinVerificationToken extends ListableObject implements HALResource {
  static type = CLARIN_VERIFICATION_TOKEN;

  /**
   * The object type
   */
  @excludeFromEquals
  @autoserialize
  type: ResourceType;

  /**
   * The identifier of this Clarin License
   */
  @autoserialize
  id: string;

  /**
   * The name of this Clarin License object
   */
  @autoserialize
  ePersonNetID: string;

  /**
   * The definition of this Clarin License object
   */
  @autoserialize
  email: string;

  /**
   * The definition of this Clarin License object
   */
  @autoserialize
  shibHeaders: string;

  /**
   * The definition of this Clarin License object
   */
  @autoserialize
  token: string;

  /**
   * The {@link HALLink}s for this Clarin License
   */
  @deserialize
  _links: {
    self: HALLink
  };

  /**
   * Method that returns as which type of object this object should be rendered
   */
  getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
    return [this.constructor as GenericConstructor<ListableObject>];
  }
}
