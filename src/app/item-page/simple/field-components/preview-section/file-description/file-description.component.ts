import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { HALEndpointService } from '../../../../../core/shared/hal-endpoint.service';
import { Router } from '@angular/router';
import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteData } from '../../../../../core/shared/operators';
import { BitstreamDataService } from '../../../../../core/data/bitstream-data.service';
import { Bitstream } from '../../../../../core/shared/bitstream.model';
import { RemoteData } from '../../../../../core/data/remote-data';
import { followLink } from '../../../../../shared/utils/follow-link-config.model';
import { fromEvent, merge, Observable, of, Subscription } from 'rxjs';
import { FileService } from '../../../../../core/shared/file.service';
import { distinctUntilChanged, switchMap, take } from 'rxjs/operators';
import { FeatureID } from '../../../../../core/data/feature-authorization/feature-id';
import { hasValue } from '../../../../../shared/empty.util';
import { AuthorizationDataService } from '../../../../../core/data/feature-authorization/authorization-data.service';
import { AuthService } from '../../../../../core/auth/auth.service';

const allowedPreviewFormats = ['text/plain', 'text/html', 'application/zip', 'application/x-tar'];
@Component({
  selector: 'ds-file-description',
  templateUrl: './file-description.component.html',
  styleUrls: ['./file-description.component.scss'],
})
export class FileDescriptionComponent implements OnInit, OnDestroy {
  MIME_TYPE_IMAGES_PATH = './assets/images/mime/';
  MIME_TYPE_DEFAULT_IMAGE_NAME = 'application-octet-stream.png';

  @Input()
  fileInput: MetadataBitstream;

  @ViewChild('videoPreview') videoElement: ElementRef;

  emailToContact: string;
  content_url$: Observable<string>;
  content_url: string;
  thumbnail_url$: Observable<string>;
  handlers_added = false;
  playPromise: Promise<void>;

  private subscriptions: Subscription = new Subscription();

  constructor(protected halService: HALEndpointService,
              private router: Router,
              private bitstreamService: BitstreamDataService,
              private auth: AuthService,
              private authDataService: AuthorizationDataService,
              private fileService: FileService,
              private configService: ConfigurationDataService) { }

  ngOnInit(): void {
    this.configService.findByPropertyName('lr.help.mail')
      .pipe(getFirstSucceededRemoteData())
      .subscribe(remoteData => {
      this.emailToContact = remoteData?.payload?.values?.[0];
    });
    this.content_url$ = this.bitstreamService.findById(this.fileInput.id, true, false, followLink('thumbnail'))
      .pipe(getFirstCompletedRemoteData(),
            switchMap((remoteData: RemoteData<Bitstream>) => {
              if (remoteData.hasSucceeded) {
                if (remoteData.payload?.thumbnail){
                  this.thumbnail_url$ = remoteData.payload?.thumbnail.pipe(
                    switchMap((thumbnailRD: RemoteData<Bitstream>) => {
                      if (thumbnailRD.hasSucceeded) {
                        return this.buildUrl(thumbnailRD.payload?._links.content.href);
                      } else {
                        return of('');
                      }
                    }),
                  );
                } else {
                  this.thumbnail_url$ = of('');
                }
                return of(remoteData.payload?._links.content.href);
              }
            }
      ));
    this.content_url$.pipe(take(1)).subscribe((url) => {
      this.content_url = url;
    });
  }

  ngAfterViewInit() {
    const video = this.videoElement?.nativeElement;

    if (video) {
      const error$ = fromEvent(video, 'error');
      this.subscriptions.add(
      error$.subscribe((event) => {
        //console.log('error', video.error.message);
        if (hasValue(video.src)) {
          this.auth.isAuthenticated().pipe(
            switchMap((isLoggedIn) => {
              if (isLoggedIn) {
                return this.authDataService.isAuthorized(FeatureID.CanDownload, this.content_url.replace('/content', ''));
              } else {
                return of(false);
              }
            }),
          ).subscribe((isAuthorized: boolean) => {
            if (isAuthorized) {
              this.add_short_lived_token_handling_to_video_playback(video);
              this.resetSource();
            } else {
              video.src = null;
            }
          });
        }
        })
      );
    }
  }

  private add_short_lived_token_handling_to_video_playback(video: HTMLVideoElement) {
      if (this.handlers_added) {
        return;
      }

      const seeking$ = fromEvent(video, 'seeking').pipe(
        switchMap((event: Event) => {
          //console.log('seeking');
          return of(video.currentTime);
        }),
        distinctUntilChanged(),
      );
      const stalled$ = fromEvent(video, 'stalled').pipe(
        switchMap((event: Event) => {
          //console.log('stalled');
          return of(video.currentTime);
        }),
        distinctUntilChanged(),
      );
      this.subscriptions.add(
      merge(seeking$, stalled$).subscribe((currentTime) => {
        this.resetSource(currentTime);
        })
      );

      this.handlers_added = true;

    }

  private resetSource(currentTime?) {
    const video = this.videoElement?.nativeElement;
    //console.log("networkState in resetSource", video.networkState);
    if (this.playPromise) {
      this.playPromise?.then(_ => {
        //playback has started
        // don't want to see The play() request was interrupted by...
        // https://developer.chrome.com/blog/play-request-was-interrupted
        this.updateSource(video, currentTime);
      }).catch(_ => {
        //do nothing
      });
    } else {
      this.updateSource(video, currentTime);
    }
  }

  private updateSource(video, currentTime) {
    //console.log("Updating the src");
    this.buildUrl(this.content_url).subscribe(result => {
      video.src = result;
      if (currentTime) {
        video.currentTime = currentTime;
      }
      this.playPromise = video.play();
    });
  }

  private buildUrl(url: string): Observable<string> {
    return url ? this.fileService.retrieveFileDownloadLink(url) : of(url);
  }

  public downloadFile() {
    void this.router.navigateByUrl('bitstreams/' + this.fileInput.id + '/download');
  }

  public isTxt() {
    return this.fileInput?.format === 'text/plain';
  }

  public isHtml() {
    return this.fileInput?.format === 'text/html';
  }

  /**
   * Supported Preview formats are: `text/plain`, `text/html`, `application/zip`
   */
  public couldPreview() {
    if (this.fileInput.canPreview === false) {
      return false;
    }

    return allowedPreviewFormats.includes(this.fileInput.format);
  }

  handleImageError(event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.MIME_TYPE_IMAGES_PATH + this.MIME_TYPE_DEFAULT_IMAGE_NAME;
  }

  isArchive(format: string): boolean {
    return format === 'application/zip' || format === 'application/x-tar';
  }

  hasNoPreview() {
    // this.fileInput.fileInfo.length === 0 means that the file has no preview
    return this.fileInput?.fileInfo?.length === 0;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
