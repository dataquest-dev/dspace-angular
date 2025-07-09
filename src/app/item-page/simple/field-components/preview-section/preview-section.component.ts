import { Component, Input, OnInit } from '@angular/core';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { Item } from 'src/app/core/shared/item.model';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';

@Component({
  selector: 'ds-preview-section',
  templateUrl: './preview-section.component.html',
  styleUrls: ['./preview-section.component.scss'],
})
export class PreviewSectionComponent implements OnInit {
  @Input() item: Item;
  @Input() listOfFiles: MetadataBitstream[];

  emailToContact: string;

  constructor(private configService: ConfigurationDataService) {} // Modified

  ngOnInit(): void {
    this.configService.findByPropertyName('lr.help.mail')?.subscribe(remoteData => {
      this.emailToContact = remoteData.payload?.values?.[0];
    });
  }


}
