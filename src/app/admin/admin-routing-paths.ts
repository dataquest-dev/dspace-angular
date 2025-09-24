import { URLCombiner } from '../core/url-combiner/url-combiner';
import { getAdminModuleRoute } from '../app-routing-paths';

export const REGISTRIES_MODULE_PATH = 'registries';
export const UPDATE_CONFIG_MODULE_PATH = 'update-config';

export function getRegistriesModuleRoute() {
  return new URLCombiner(getAdminModuleRoute(), REGISTRIES_MODULE_PATH).toString();
}

export function getUpdateConfigModuleRoute() {
  return new URLCombiner(getAdminModuleRoute(), UPDATE_CONFIG_MODULE_PATH).toString();
}
