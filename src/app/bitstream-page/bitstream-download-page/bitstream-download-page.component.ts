import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { catchError, filter, map, startWith, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { hasValue, isNotEmpty } from '../../shared/empty.util';
import { getRemoteDataPayload } from '../../core/shared/operators';
import { Bitstream } from '../../core/shared/bitstream.model';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { AuthService } from '../../core/auth/auth.service';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subject } from 'rxjs';
import { FileService } from '../../core/shared/file.service';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { getForbiddenRoute } from '../../app-routing-paths';
import { RemoteData } from '../../core/data/remote-data';
import { redirectOn4xx } from '../../core/shared/authorized.operators';
import { isPlatformServer, Location } from '@angular/common';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { ServerResponseService } from '../../core/services/server-response.service';
import { SignpostingLink } from '../../core/data/signposting-links.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'ds-bitstream-download-page',
  templateUrl: './bitstream-download-page.component.html'
})
/**
 * Page component for downloading a bitstream
 */
export class BitstreamDownloadPageComponent implements OnInit, OnDestroy {

  bitstream$: Observable<Bitstream>;
  bitstreamRD$: Observable<RemoteData<Bitstream>>;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private authorizationService: AuthorizationDataService,
    private auth: AuthService,
    private fileService: FileService,
    private hardRedirectService: HardRedirectService,
    private location: Location,
    public dsoNameService: DSONameService,
    private signpostingDataService: SignpostingDataService,
    private responseService: ServerResponseService,
    @Inject(PLATFORM_ID) protected platformId: string
  ) {
  }

  back(): void {
    this.location.back();
  }

  ngOnInit(): void {

    this.bitstreamRD$ = this.route.data.pipe(
      map((data) => data.bitstream));

    this.bitstream$ = this.bitstreamRD$.pipe(
      redirectOn4xx(this.router, this.auth),
      getRemoteDataPayload()
    );

    const download$ = this.bitstream$.pipe(
      switchMap((bitstream: Bitstream) => {
        const isAuthorized$ = this.authorizationService.isAuthorized(FeatureID.CanDownload, isNotEmpty(bitstream) ? bitstream.self : undefined);
        const isLoggedIn$ = this.auth.isAuthenticated();
        return observableCombineLatest([isAuthorized$, isLoggedIn$, observableOf(bitstream)]);
      }),
      filter(([isAuthorized, isLoggedIn, bitstream]: [boolean, boolean, Bitstream]) => hasValue(isAuthorized) && hasValue(isLoggedIn)),
      take(1),
      switchMap(([isAuthorized, isLoggedIn, bitstream]: [boolean, boolean, Bitstream]) => {
        if (isAuthorized && isLoggedIn) {
          return this.fileService.retrieveFileDownloadLink(bitstream._links.content.href).pipe(
            filter((fileLink) => hasValue(fileLink)),
            take(1),
            map((fileLink) => {
              return [isAuthorized, isLoggedIn, bitstream, fileLink];
            }));
        } else {
          return [[isAuthorized, isLoggedIn, bitstream, '']];
        }
      })
    );

    download$.pipe(
      withLatestFrom(this.initPageLinks().pipe(startWith(undefined))),
      take(1),
      map(([download]) => download),
      takeUntil(this.destroy$)
    ).subscribe(([isAuthorized, isLoggedIn, bitstream, fileLink]: [boolean, boolean, Bitstream, string]) => {
      if (isAuthorized && isLoggedIn && isNotEmpty(fileLink)) {
        this.hardRedirectService.redirect(fileLink);
      } else if (isAuthorized && !isLoggedIn) {
        this.hardRedirectService.redirect(bitstream._links.content.href);
      } else if (!isAuthorized && isLoggedIn) {
        this.router.navigateByUrl(getForbiddenRoute(), {skipLocationChange: true});
      } else if (!isAuthorized && !isLoggedIn) {
        this.auth.setRedirectUrl(this.router.url);
        this.router.navigateByUrl('login');
      }
    });
  }

  /**
   * Create page links if any are retrieved by signposting endpoint
   *
   * @private
   */
  private initPageLinks(): Observable<void> {
    if (!environment.signpostingEnabled || !isPlatformServer(this.platformId)) {
      return observableOf(undefined);
    }
    return this.route.params.pipe(
      take(1),
      switchMap(params => this.signpostingDataService.getLinks(params.id).pipe(take(1))),
      tap((signpostingLinks: SignpostingLink[]) => {
        const links = (Array.isArray(signpostingLinks) ? signpostingLinks : []).map((link: SignpostingLink) =>
          `<${link.href}> ; rel="${link.rel}"` + (isNotEmpty(link.type) ? ` ; type="${link.type}" ` : ' ')
        ).join(', ');
        if (isNotEmpty(links)) {
          this.responseService.setHeader('Link', links);
        }
      }),
      map(() => undefined),
      catchError(() => {
        console.warn('Unable to load signposting links for the download response.');
        return observableOf(undefined);
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
