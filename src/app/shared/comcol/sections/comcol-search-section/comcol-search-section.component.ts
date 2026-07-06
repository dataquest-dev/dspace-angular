import { AsyncPipe } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  Data,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  APP_CONFIG,
  AppConfig,
} from '../../../../../config/app-config.interface';
import { RemoteData } from '../../../../core/data/remote-data';
import { Collection } from '../../../../core/shared/collection.model';
import { Community } from '../../../../core/shared/community.model';
import { Context } from '../../../../core/shared/context.model';
import { SEARCH_CONFIG_SERVICE } from '../../../../my-dspace-page/my-dspace-configuration.service';
import { hasValue } from '../../../empty.util';
import { ThemedSearchComponent } from '../../../search/themed-search.component';
import { ComcolSearchSectionConfigurationService } from './comcol-search-section-configuration.service';

/**
 * The search tab on community & collection pages
 */
@Component({
  selector: 'ds-comcol-search-section',
  templateUrl: './comcol-search-section.component.html',
  styleUrls: ['./comcol-search-section.component.scss'],
  providers: [
    {
      provide: SEARCH_CONFIG_SERVICE,
      useClass: ComcolSearchSectionConfigurationService,
    },
  ],
  imports: [
    AsyncPipe,
    ThemedSearchComponent,
  ],
})
export class ComcolSearchSectionComponent implements OnInit {

  protected readonly comcolContext = Context.Any;


  comcol$: Observable<Community | Collection>;

  showSidebar$: Observable<boolean>;

  constructor(
    @Inject(APP_CONFIG) public appConfig: AppConfig,
    protected route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    this.comcol$ = this.route.parent.data.pipe(
      map((data: Data) => (data.dso as RemoteData<Community | Collection>).payload),
    );
    this.showSidebar$ = this.comcol$.pipe(
      map((comcol: Community | Collection) => hasValue(comcol) && this.appConfig[comcol.type as any].searchSection.showSidebar),
    );
  }

}
