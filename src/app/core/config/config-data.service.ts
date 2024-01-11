import { Observable } from 'rxjs';
<<<<<<< HEAD
=======
import { map } from 'rxjs/operators';

>>>>>>> dspace-7.6.1
import { ConfigObject } from './models/config.model';
import { RemoteData } from '../data/remote-data';
import { FollowLinkConfig } from '../../shared/utils/follow-link-config.model';
import { getFirstCompletedRemoteData } from '../shared/operators';
<<<<<<< HEAD
import { map } from 'rxjs/operators';
import { BaseDataService } from '../data/base/base-data.service';
=======
import { IdentifiableDataService } from '../data/base/identifiable-data.service';
>>>>>>> dspace-7.6.1

/**
 * Abstract data service to retrieve configuration objects from the REST server.
 * Common logic for configuration objects should be implemented here.
 */
<<<<<<< HEAD
export abstract class ConfigDataService extends BaseDataService<ConfigObject> {
=======
export abstract class ConfigDataService extends IdentifiableDataService<ConfigObject> {
>>>>>>> dspace-7.6.1
  /**
   * Returns an observable of {@link RemoteData} of an object, based on an href, with a list of
   * {@link FollowLinkConfig}, to automatically resolve {@link HALLink}s of the object
   *
   * Throws an error if a configuration object cannot be retrieved.
   *
   * @param href                        The url of object we want to retrieve
   * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's
   *                                    no valid cached version. Defaults to true
   * @param reRequestOnStale            Whether or not the request should automatically be re-
   *                                    requested after the response becomes stale
   * @param linksToFollow               List of {@link FollowLinkConfig} that indicate which
   *                                    {@link HALLink}s should be automatically resolved
   */
  public findByHref(href: string, useCachedVersionIfAvailable = true, reRequestOnStale = true, ...linksToFollow: FollowLinkConfig<ConfigObject>[]): Observable<RemoteData<ConfigObject>> {
    return super.findByHref(href, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow).pipe(
      getFirstCompletedRemoteData(),
      map((rd: RemoteData<ConfigObject>) => {
        if (rd.hasFailed) {
          throw new Error(`Couldn't retrieve the config`);
        } else {
          return rd;
        }
      }),
    );
  }
<<<<<<< HEAD
=======

  /**
   * Returns a config object by given name
   *
   * Throws an error if a configuration object cannot be retrieved.
   *
   * @param name                        The name of configuration to retrieve
   * @param useCachedVersionIfAvailable If this is true, the request will only be sent if there's
   *                                    no valid cached version. Defaults to true
   * @param reRequestOnStale            Whether or not the request should automatically be re-
   *                                    requested after the response becomes stale
   * @param linksToFollow               List of {@link FollowLinkConfig} that indicate which
   *                                    {@link HALLink}s should be automatically resolved
   */
  public findByName(name: string,  useCachedVersionIfAvailable = true, reRequestOnStale = true, ...linksToFollow: FollowLinkConfig<ConfigObject>[]): Observable<RemoteData<ConfigObject>> {
    return super.findById(name, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow);
  }
>>>>>>> dspace-7.6.1
}
