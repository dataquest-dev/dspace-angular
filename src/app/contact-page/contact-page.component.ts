import { Component, OnInit } from '@angular/core';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ds-contact-page',
  styleUrls: ['./contact-page.component.scss'],
  templateUrl: './contact-page.component.html'
})
export class ContactPageComponent implements OnInit {
  emailToContact: BehaviorSubject<string> = new BehaviorSubject<string>('');
  constructor(
    private configService: ConfigurationDataService
  ) {}

  ngOnInit(): void {
    this.configService.findByPropertyName('lr.help.mail').subscribe(remoteData => {
      this.emailToContact.next(remoteData.payload.values[0]);
    });
  }
}
