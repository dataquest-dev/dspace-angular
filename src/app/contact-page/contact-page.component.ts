import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ds-contact-page',
  styleUrls: ['./contact-page.component.scss'],
  templateUrl: './contact-page.component.html'
})
export class ContactPageComponent implements OnInit{
    ngOnInit(): void {
        console.log('hi');
    }
}
