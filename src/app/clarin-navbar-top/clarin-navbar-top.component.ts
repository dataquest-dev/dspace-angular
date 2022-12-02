import {Component, Inject, OnInit, Renderer2} from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { take } from 'rxjs/operators';
import { EPerson } from '../core/eperson/models/eperson.model';
import { DOCUMENT } from '@angular/common';
import {ScriptLoaderService} from './script-loader-service';

declare let gapi: any;

/**
 * The component which wraps `language` and `login`/`logout + profile` operations in the top navbar.
 */
@Component({
  selector: 'ds-clarin-navbar-top',
  templateUrl: './clarin-navbar-top.component.html',
  styleUrls: ['./clarin-navbar-top.component.scss']
})
export class ClarinNavbarTopComponent implements OnInit {

  constructor(private authService: AuthService,
              private renderer: Renderer2,
              private scriptLoader: ScriptLoaderService) { }

  /**
   * The current authenticated user. It is null if the user is not authenticated.
   */
  authenticatedUser = null;

  @Inject(DOCUMENT) private document: Document;
  // @Inject(DOCUMENT) private aai: Document;

  ngOnInit(): void {
    let authenticated = false;

    this.authService.isAuthenticated()
      .pipe(take(1))
      .subscribe( auth => {
      authenticated = auth;
    });

    if (authenticated) {
      this.authService.getAuthenticatedUserFromStore().subscribe((user: EPerson) => {
        this.authenticatedUser = user;
      });
    } else {
      this.authenticatedUser = null;
    }

    // At first load DiscoJuice, second AAI and at last AAIConfig
    this.loadDiscoJuice().then(() => {
      this.loadAAI().then(() => {
        this.loadAAIConfig().catch(error => console.log(error));
      }).catch(error => console.log(error));
    }).catch(error => console.log(error));
  }

  private loadDiscoJuice = (): Promise<any> => {
    return this.scriptLoader.load('discojuice');
  }

  private loadAAI = (): Promise<any> => {
    return this.scriptLoader.load('aai');
  }

  private loadAAIConfig = (): Promise<any> => {
    return this.scriptLoader.load('aaiConfig');
  }
}
