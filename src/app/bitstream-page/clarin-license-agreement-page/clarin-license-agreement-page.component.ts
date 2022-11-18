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
  getAllCompletedRemoteData,
  getAllSucceededRemoteData, getAllSucceededRemoteListPayload,
  getFirstCompletedRemoteData, getFirstSucceededRemoteDataPayload, getFirstSucceededRemoteDataWithNotEmptyPayload,
  getFirstSucceededRemoteListPayload,
  getPaginatedListPayload, getRemoteDataPayload
} from '../../core/shared/operators';
import {ClruaModel} from '../../core/shared/clarin/clrua.model';
import {RequestParam} from '../../core/cache/models/request-param.model';
import {hasValue, isEmpty, isNotEmpty, isNotNull, isNotUndefined, isNull} from '../../shared/empty.util';
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
import {HELP_DESK_PROPERTY} from '../../item-page/tombstone/tombstone.component';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import {ConfigurationProperty} from '../../core/shared/configuration-property.model';
import {BundleDataService} from '../../core/data/bundle-data.service';
import {Bundle} from '../../core/shared/bundle.model';
import {HttpClient} from '@angular/common/http';
import {ClarinUserMetadataDataService} from '../../core/data/clarin/clarin-user-metadata.service';

@Component({
  selector: 'ds-clarin-license-agreement-page',
  templateUrl: './clarin-license-agreement-page.component.html',
  styleUrls: ['./clarin-license-agreement-page.component.scss']
})
export class ClarinLicenseAgreementPageComponent implements OnInit {

  @Input()
  bitstream$: Observable<Bitstream>;

  ipAddress$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  item$: BehaviorSubject<Item> = new BehaviorSubject<Item>(null);
  userRegistration$: BehaviorSubject<ClarinUserRegistration> = new BehaviorSubject<ClarinUserRegistration>(null);
  userMetadata$: BehaviorSubject<PaginatedList<ClarinUserMetadata>> = new BehaviorSubject<PaginatedList<ClarinUserMetadata>>(null);
  resourceMapping$: BehaviorSubject<ClarinLicenseResourceMapping> = new BehaviorSubject<ClarinLicenseResourceMapping>(null);
  clarinLicense$: BehaviorSubject<ClarinLicense> = new BehaviorSubject<ClarinLicense>(null);
  currentUser$: BehaviorSubject<EPerson> = new BehaviorSubject<EPerson>(null);

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  constructor(
    protected clarinLicenseService: ClarinLicenseDataService,
    protected clruaService: ClruaDataService,
    protected clarinLicenseResourceMappingService: ClarinLicenseResourceMappingService,
    protected configurationDataService: ConfigurationDataService,
    protected bundleService: BundleDataService,
    protected userMetadataService: ClarinUserMetadataDataService,
    private auth: AuthService,
    private http: HttpClient) { }

  ngOnInit(): void {
    this.loadCurrentItem();
    this.loadHelpDeskEmail();
    this.loadIPAddress();

    // Get bitstreamUUID and currentUserUUID to search data from ClarinLicenseResourceUserAllowance - Clrua
    let bistreamUUID = null;
    let currentUserUUID = null;
    this.bitstream$.pipe(take(1)).subscribe( bitstream => {
      return bistreamUUID = bitstream.uuid;
    });
    this.getCurrentUser().pipe(take(1)).subscribe((user) => {
      this.currentUser$.next(user);
      currentUserUUID = user.uuid;
    });

    // this.userMetadataService.findAll()
    //   .pipe(getFirstCompletedRemoteData())
    //   .subscribe(response => {
    //     console.log('response', response);
    //   });

    // Get UserMetadata, UserRegistration, LicenseResourceMapping data from ClarinLicenseResourceUserAllowance - Clrua
    this.clruaService.searchBy('byBitstreamAndUser',
      this.createSearchOptions(bistreamUUID, currentUserUUID), false, true,
      followLink('userRegistration'), followLink('userMetadata'), followLink('resourceMapping'))
      .pipe(
        getFirstSucceededRemoteListPayload())
      .subscribe(res => {
        const clrua = res?.[0];
        console.log('clrua', clrua);
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
            console.log('resourceMapping', resourceMapping$);
          this.resourceMapping$.next(resourceMapping$?.payload);
        });
        // Load userMetadata
        clrua.userMetadata
          .pipe(getFirstCompletedRemoteData())
          .subscribe(userMetadata$ => {
          // this.userMetadata$.next(userMetadata$);
          console.log('userMetadata$', userMetadata$.payload);
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

  private loadIPAddress() {
    this.http.get('http://api.ipify.org/?format=json').subscribe((res: any) => {
      this.ipAddress$.next(res.ip);
    });
  }

  private loadCurrentItem() {
    this.bitstream$.pipe(
      take(1),
      switchMap((bitstreamRD$) => {
        return bitstreamRD$?.bundle;
      })
    )
      // Get Bundle of the Bitstream
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((bundleRD$: RemoteData<Bundle>) => {
          return this.bundleService.findById(bundleRD$?.payload?.id, false, true,
            followLink('item'));
        })
      )
      // Get Bundle with Item
      .pipe(
        getFirstCompletedRemoteData(),
        switchMap((bundleRD$: RemoteData<Bundle>) => {
          return bundleRD$.payload?.item;
        })
      )
      // Get Bundle's Item
      .pipe(getFirstCompletedRemoteData())
      .subscribe(itemRD$ => {
        this.item$.next(itemRD$.payload);
      });
  }

  private loadHelpDeskEmail() {
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);
  }
}
