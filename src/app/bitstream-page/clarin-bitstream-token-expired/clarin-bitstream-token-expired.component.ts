import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Bitstream } from '../../core/shared/bitstream.model';
import { take } from 'rxjs/operators';
import { getBitstreamDownloadRoute } from '../../app-routing-paths';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';

/**
 * This component shows error that the download token is expired and redirect the user to the Item View page
 * after 5 seconds.
 */
@Component({
  selector: 'ds-clarin-bitstream-token-expired',
  templateUrl: './clarin-bitstream-token-expired.component.html',
  styleUrls: ['./clarin-bitstream-token-expired.component.scss']
})
export class ClarinBitstreamTokenExpiredComponent implements OnInit {

  @Input()
  bitstream$: Observable<Bitstream>;

  constructor(
    private hardRedirectService: HardRedirectService,
    private halService: HALEndpointService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
        this.bitstream$.pipe(take(1))
          .subscribe(bitstream => {
            const bitstreamDownloadPath = this.halService.getRootHref() + getBitstreamDownloadRoute(bitstream);
            this.hardRedirectService.redirect(bitstreamDownloadPath);
          });
      },
      5000);
  }
}
