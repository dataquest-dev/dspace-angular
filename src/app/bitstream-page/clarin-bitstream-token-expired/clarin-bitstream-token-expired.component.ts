import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { getBitstreamDownloadRoute } from '../../app-routing-paths';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { Bitstream } from '../../core/shared/bitstream.model';
import { isNotEmpty } from '../../shared/empty.util';

/**
 * This component shows error that the download token is expired and redirect the user to the Item View page
 * after 5 seconds.
 */
@Component({
  imports: [
    TranslateModule,
  ],
  selector: 'ds-clarin-bitstream-token-expired',
  templateUrl: './clarin-bitstream-token-expired.component.html',
  styleUrls: ['./clarin-bitstream-token-expired.component.scss'],
})
export class ClarinBitstreamTokenExpiredComponent implements OnInit {

  @Input()
  bitstream$: Observable<Bitstream>;

  /**
   * The request-a-copy access token of the download page, kept for the next try.
   */
  @Input()
  accessToken: string;

  constructor(
    private hardRedirectService: HardRedirectService,
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.bitstream$.pipe(take(1))
        .subscribe(bitstream => {
          let bitstreamDownloadPath = getBitstreamDownloadRoute(bitstream);
          if (isNotEmpty(this.accessToken)) {
            bitstreamDownloadPath += '?accessToken=' + encodeURIComponent(this.accessToken);
          }
          this.hardRedirectService.redirect(bitstreamDownloadPath);
        });
    },
    5000);
  }
}
