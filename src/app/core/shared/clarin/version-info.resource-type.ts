import { ResourceType } from '../resource-type';

/**
* Needs to be in a separate file to prevent circular
* dependencies in webpack.
*/
export const VERSION_INFO = new ResourceType('versioninfo');
