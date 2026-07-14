import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';
import { RegistryService } from 'src/app/core/registry/registry.service';
import { Item } from 'src/app/core/shared/item.model';
import { getAllSucceededRemoteListPayload } from 'src/app/core/shared/operators';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';

@Component({
  selector: 'ds-preview-section',
  templateUrl: './preview-section.component.html',
  styleUrls: ['./preview-section.component.scss'],
})
export class PreviewSectionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() item: Item;

  listOfFiles: BehaviorSubject<MetadataBitstream[]> = new BehaviorSubject<MetadataBitstream[]>([] as any);
  emailToContact: string;
  hasNoFiles: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  private currentItemHandle: string;
  private filesSubscription?: Subscription;
  private configSubscription?: Subscription;

  constructor(protected registryService: RegistryService,
              private configService: ConfigurationDataService) {}

  ngOnInit(): void {
    this.configSubscription = this.configService.findByPropertyName('lr.help.mail')?.subscribe(remoteData => {
      this.emailToContact = remoteData.payload?.values?.[0];
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.item) {
      this.refreshFiles(true);
    }
  }

  ngOnDestroy(): void {
    this.filesSubscription?.unsubscribe();
    this.configSubscription?.unsubscribe();
  }

  private refreshFiles(force = false): void {
    const handle = this.item?.handle;
    if (!handle) {
      return;
    }

    if (!force && handle === this.currentItemHandle) {
      return;
    }

    this.currentItemHandle = handle;
    this.filesSubscription?.unsubscribe();
    this.filesSubscription = this.registryService
      .getMetadataBitstream(handle, 'ORIGINAL')
      .pipe(getAllSucceededRemoteListPayload())
      .subscribe((data: MetadataBitstream[]) => {
        this.listOfFiles.next(data);
        this.hasNoFiles.next(!Array.isArray(data) || data.length === 0);
      });
  }
}
