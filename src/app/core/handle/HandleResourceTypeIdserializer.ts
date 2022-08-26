import {UNDEFINED_NAME} from '../../shared/mocks/dso-name.service.mock';
import {COLLECTION, COMMUNITY, ITEM} from './handle.model';

export const HandleResourceTypeIdSerializer = {
  Serialize(resourceTypeId: string): number {


    switch (resourceTypeId) {
      case ITEM:
        return 2;
      case COLLECTION:
        return 3;
      case COMMUNITY:
        return 4;
      default:
        return null;
    }
  },

  Deserialize(resourceTypeId: number): string {
    switch (resourceTypeId) {
      case 2:
        return ITEM;
      case 3:
        return COLLECTION;
      case 4:
        return COMMUNITY;
      default:
        return UNDEFINED_NAME;
    }
  }
};
