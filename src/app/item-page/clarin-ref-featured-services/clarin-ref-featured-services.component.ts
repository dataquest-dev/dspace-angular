import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';
import {HardRedirectService} from '../../core/services/hard-redirect.service';
import {BehaviorSubject} from 'rxjs';
import {isNull, isUndefined} from '../../shared/empty.util';

@Component({
  selector: 'ds-clarin-ref-featured-services',
  templateUrl: './clarin-ref-featured-services.component.html',
  styleUrls: ['./clarin-ref-featured-services.component.scss']
})
export class ClarinRefFeaturedServicesComponent implements OnInit {

  @Input() item: Item;

  fbShareURL = 'http://www.facebook.com/sharer/sharer.php';
  twtrShareURL = 'http://twitter.com/intent/tweet';

  fbRedirectURL: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  twitterRedirectURL: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor() { }

  ngOnInit(): void {
    this.prepareFbRedirectURL();
    this.prepareTwtrRedirectURL();
  }

  prepareFbRedirectURL() {
    const itemHandle = this.getMetadata('dc.identifier.uri');
    if (isNull(itemHandle)) {
      return;
    }

    // Compose the URL
    const redirectURL = this.fbShareURL + '?u=' + itemHandle;
    this.fbRedirectURL.next(redirectURL);
  }

  prepareTwtrRedirectURL() {
    const itemHandle = this.getMetadata('dc.identifier.uri');
    const itemName = this.getMetadata('dc.title');
    if (isNull(itemHandle)) {
      return;
    }

    // Compose the URL
    let redirectURL = this.twtrShareURL + '?url=' + itemHandle;
    redirectURL = isNull(itemName) ? redirectURL : redirectURL + '&text=' + itemName;
    this.twitterRedirectURL.next(redirectURL);
  }

  getMetadata(metadataName) {
    const metadata = this.item.metadata[metadataName];
    if (isUndefined(metadata) || isNull(metadata)) {
      return null;
    }

    return metadata[0]?.value;
  }

}
