import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Community } from '../shared/community.model';
import { RemoteData } from '../data/remote-data';
import { DSONameService } from '../breadcrumbs/dso-name.service';

@Injectable({
  providedIn: 'root'
})
export class CommunityPathService {

  constructor(private dsoNameService: DSONameService) {}

  /**
   * Get the full path for a community by recursively following parent community links
   * @param community The community to get the path for
   * @returns Observable<string> The full path (e.g., "Root Community > Child Community > Target Community")
   */
  getFullPath(community: Community): Observable<string> {
    return this.buildPathRecursive(community).pipe(
      map(pathArray => pathArray.reverse().join(' > '))
    );
  }

  /**
   * Recursively build the path array from the target community up to the root
   * @param community The current community
   * @returns Observable<string[]> Array of community names from target to root
   */
  private buildPathRecursive(community: Community): Observable<string[]> {
    const currentName = this.dsoNameService.getName(community);

    // If there's no parent community link or it's not resolved, return just this community's name
    if (!community.parentCommunity) {
      return of([currentName]);
    }
    
    return community.parentCommunity.pipe(
      switchMap((parentRD: RemoteData<Community>) => {
        // If the parent community data failed to load or doesn't exist, return just this community's name
        if (!parentRD.hasSucceeded || !parentRD.payload) {
          return of([currentName]);
        }
        
        // Recursively get the parent's path and add this community's name
        return this.buildPathRecursive(parentRD.payload).pipe(
          map(parentPath => [...parentPath, currentName])
        );
      }),
      catchError(() => {
        // If there's an error, just return this community's name
        return of([currentName]);
      })
    );
  }

  /**
   * Check if a community has parent communities (used to determine if we should show the full path)
   * @param community The community to check
   * @returns Observable<boolean> True if the community has parents, false otherwise
   */
  hasParents(community: Community): Observable<boolean> {
    if (!community.parentCommunity) {
      return of(false);
    }

    return community.parentCommunity.pipe(
      map((parentRD: RemoteData<Community>) => parentRD.hasSucceeded && !!parentRD.payload),
      catchError(() => of(false))
    );
  }
}