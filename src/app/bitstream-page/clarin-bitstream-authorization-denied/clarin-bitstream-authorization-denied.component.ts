import { AsyncPipe } from '@angular/common';
import {
  Component,
  Input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { Bitstream } from '../../core/shared/bitstream.model';

/**
 * This component shows error that the READ access to the bitstream is denied.
 */
@Component({
  imports: [
    AsyncPipe,
    TranslateModule,
  ],
  selector: 'ds-clarin-bitstream-authorization-denied',
  templateUrl: './clarin-bitstream-authorization-denied.component.html',
  styleUrls: ['./clarin-bitstream-authorization-denied.component.scss'],
})
export class ClarinBitstreamAuthorizationDeniedComponent {

  @Input()
  bitstream$: Observable<Bitstream>;

}
