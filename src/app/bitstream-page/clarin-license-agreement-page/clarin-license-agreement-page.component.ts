import {Component, Input, OnInit} from '@angular/core';
import {Bitstream} from '../../core/shared/bitstream.model';
import {BehaviorSubject, combineLatest as observableCombineLatest, Observable, of as observableOf} from 'rxjs';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {filter, map, startWith, switchMap, take} from 'rxjs/operators';
import {hasCompleted, hasSucceeded} from '../../core/data/request.reducer';
import {ClruaDataService} from '../../core/data/clarin/clrua-data.service';
import {followLink} from '../../shared/utils/follow-link-config.model';
import {ClarinUserRegistration} from '../../core/shared/clarin/clarin-user-registration.model';
import {ClarinUserMetadata} from '../../core/shared/clarin/clarin-user-metadata.model';
import {
  getAllSucceededRemoteData, getAllSucceededRemoteListPayload,
  getFirstCompletedRemoteData, getFirstSucceededRemoteDataPayload,
  getFirstSucceededRemoteListPayload,
  getPaginatedListPayload, getRemoteDataPayload
} from '../../core/shared/operators';
import {ClruaModel} from '../../core/shared/clarin/clrua.model';
import {RequestParam} from '../../core/cache/models/request-param.model';
import {hasValue, isEmpty, isNotEmpty, isNotNull, isNull} from '../../shared/empty.util';
import {FindListOptions} from '../../core/data/request.models';
import {EPerson} from '../../core/eperson/models/eperson.model';
import {AuthService} from '../../core/auth/auth.service';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {RemoteData} from '../../core/data/remote-data';
import {ClarinLicenseResourceMapping} from '../../core/shared/clarin/clarin-license-resource-mapping.model';
import {Item} from '../../core/shared/item.model';
import {Relationship} from '../../core/shared/item-relationships/relationship.model';
import {MetadataSchema} from '../../core/metadata/metadata-schema.model';
import {EpersonDtoModel} from '../../core/eperson/models/eperson-dto.model';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {ClarinLicenseResourceMappingService} from '../../core/data/clarin/clarin-license-resource-mapping-data.service';

@Component({
  selector: 'ds-clarin-license-agreement-page',
  templateUrl: './clarin-license-agreement-page.component.html',
  styleUrls: ['./clarin-license-agreement-page.component.scss']
})
export class ClarinLicenseAgreementPageComponent implements OnInit {

  @Input()
  bitstream$: Observable<Bitstream>;

  userRegistration$: BehaviorSubject<ClarinUserRegistration> = new BehaviorSubject<ClarinUserRegistration>(null);
  userMetadata$: BehaviorSubject<PaginatedList<ClarinUserMetadata>> = new BehaviorSubject<PaginatedList<ClarinUserMetadata>>(null);
  resourceMapping$: BehaviorSubject<ClarinLicenseResourceMapping> = new BehaviorSubject<ClarinLicenseResourceMapping>(null);
  clarinLicense$: BehaviorSubject<ClarinLicense> = new BehaviorSubject<ClarinLicense>(null);

  constructor(
    protected clarinLicenseService: ClarinLicenseDataService,
    protected clruaService: ClruaDataService,
    protected clarinLicenseResourceMappingService: ClarinLicenseResourceMappingService,
    private auth: AuthService) { }

  ngOnInit(): void {
    // Get bitstreamUUID and currentUserUUID to search data from ClarinLicenseResourceUserAllowance - Clrua
    let bistreamUUID = null;
    let currentUserUUID = null;
    this.bitstream$.pipe(take(1)).subscribe( bitstream => {
      return bistreamUUID = bitstream.uuid;
    });
    this.getCurrentUser().pipe(take(1)).subscribe((user) => {
      currentUserUUID = user.uuid;
    });

    // Get UserMetadata, UserRegistration, LicenseResourceMapping data from ClarinLicenseResourceUserAllowance - Clrua
    this.clruaService.searchBy('byBitstreamAndUser',
      this.createSearchOptions(bistreamUUID, currentUserUUID), false, true,
      followLink('userRegistration'), followLink('userMetadata'), followLink('resourceMapping'))
      .pipe(
        getFirstCompletedRemoteData())
      .subscribe(res => {
        const clrua = res?.payload?.page?.[0];
        if (isNull(clrua)) {
          return;
        }
        // Load userRegistration
        clrua.userRegistration
          .pipe(getFirstCompletedRemoteData())
          .subscribe(userRegistration => {
          this.userRegistration$.next(userRegistration?.payload);
        });
        // Load resourceMapping
        clrua.resourceMapping
          .pipe(getFirstCompletedRemoteData())
          .subscribe(resourceMapping$ => {
          this.resourceMapping$.next(resourceMapping$?.payload);
        });
        // Load userMetadata
        clrua.userMetadata.
        pipe(getFirstCompletedRemoteData())
          .subscribe(userMetadata => {
          this.userMetadata$.next(userMetadata.payload);
        });
        // Load clarinLicense from resourceMapping
        this.resourceMapping$.pipe(
          switchMap((resourceMapping: ClarinLicenseResourceMapping) => {
            return this.clarinLicenseResourceMappingService.findByHref(resourceMapping?._links?.self?.href,
              false, true, followLink('clarinLicense'));
          })
        ).pipe(getFirstCompletedRemoteData())
          .subscribe(resourceMapping$ => {
          const clarinLicense$ = resourceMapping$.payload.clarinLicense;
          clarinLicense$
            .subscribe(clarinLicense => {
              this.clarinLicense$.next(clarinLicense?.payload);
            });
        });
    });
  }

  private createSearchOptions(bitstreamUUID: string, ePersonUUID: string) {
    const params = [];
    // params.push(new RequestParam('bitstreamUUID', bitstreamUUID));
    if (hasValue(bitstreamUUID)) {
      params.push(new RequestParam('bitstreamUUID', bitstreamUUID));
    }
    if (hasValue(ePersonUUID)) {
      params.push(new RequestParam('userUUID', ePersonUUID));
    }
    return Object.assign(new FindListOptions(), {
      searchParams: [...params]
    });
  }

  /**
   * Retrieve the current user
   */
  private getCurrentUser(): Observable<EPerson> {
    return this.auth.isAuthenticated().pipe(
      switchMap((authenticated) => {
        if (authenticated) {
          return this.auth.getAuthenticatedUserFromStore();
        } else {
          return observableOf(undefined);
        }
      })
    );
  }
}
