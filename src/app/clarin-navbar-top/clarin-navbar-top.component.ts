import { Component, OnInit } from '@angular/core';
import {AuthService} from '../core/auth/auth.service';
import {take} from 'rxjs/operators';
import {EPerson} from '../core/eperson/models/eperson.model';

@Component({
  selector: 'ds-clarin-navbar-top',
  templateUrl: './clarin-navbar-top.component.html',
  styleUrls: ['./clarin-navbar-top.component.scss']
})
export class ClarinNavbarTopComponent implements OnInit {

  constructor(private authService: AuthService) { }

  authenticated = false;

  authenticatedUser = null;

  userName = '';

  ngOnInit(): void {
    this.authService.isAuthenticated()
      .pipe(take(1))
      .subscribe( auth => {
      this.authenticated = auth;
    });

    if (this.authenticated) {
      this.authService.getAuthenticatedUserFromStore().subscribe((user: EPerson) => {
        this.authenticatedUser = user;
      });
    } else {
      this.authenticatedUser = null;
    }
  }

}
