import {Component, Inject} from '@angular/core';
import { TopLevelCommunityListComponent as BaseComponent } from '../../../../../app/home-page/top-level-community-list/top-level-community-list.component';
import {
  getFirstSucceededRemoteListPayload
} from '../../../../../app/core/shared/operators';
import { BehaviorSubject } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../../../../config/app-config.interface';
import { CommunityDataService } from '../../../../../app/core/data/community-data.service';
import { PaginationService } from '../../../../../app/core/pagination/pagination.service';
import { LocaleService } from '../../../../../app/core/locale/locale.service';
import { getCommunityPageRoute } from '../../../../../app/community-page/community-page-routing-paths';
import { DSONameService } from '../../../../../app/core/breadcrumbs/dso-name.service';

export const OPEN_RESOURCES = 'Otevřené zdroje / Open resources';
export const PUBLICATIONS = 'Publikační činnost / Publications';
export const THESES = 'Vysokoškolské kvalifikační práce / Theses';
export const THESES_CS_CUSTOM = 'Kvalifikační práce';

export const OPEN_RESOURCE_BG = '#31859C';
export const PUBLICATIONS_BG = '#427D7B';
export const THESES_BG = '#ADD7D6'

@Component({
  selector: 'ds-top-level-community-list',
  styleUrls: ['./top-level-community-list.component.scss'],
  // styleUrls: ['../../../../../app/home-page/top-level-community-list/top-level-community-list.component.scss'],
  templateUrl: './top-level-community-list.component.html'
  // templateUrl: '../../../../../app/home-page/top-level-community-list/top-level-community-list.component.html'
})

export class TopLevelCommunityListComponent extends BaseComponent {

  communitiesRedirect: BehaviorSubject<CommunityRedirect[]> = new BehaviorSubject<CommunityRedirect[]>([]);


  constructor(@Inject(APP_CONFIG) protected appConfig: AppConfig,
              protected cds: CommunityDataService,
              protected paginationService: PaginationService,
              private dsoNameService: DSONameService,
              private localeService: LocaleService) {
    super(appConfig, cds, paginationService);
  }

  ngOnInit() {
    super.ngOnInit();
    this.communitiesRD$.pipe(getFirstSucceededRemoteListPayload())
      .subscribe((communitiesRD) => {
        const communitiesRedirectTemp = [];
        communitiesRD.forEach((community) => {
          const communityNameBothLang = community.firstMetadataValue('dc.title');
          const communityName = this.dsoNameService.getName(community);
          console.log('communityName', communityName);
          const communityRedirect: CommunityRedirect = {
            uuid: community.uuid,
            name: communityName,
            bgColor: '',
            textColor: 'white'
          };
          switch (communityNameBothLang) {
            case THESES:
              // CS language has a customized namd for the `Theses` community
              if(this.localeService.isLanguage('cs')) {
                communityRedirect.name = THESES_CS_CUSTOM;
              }
              communitiesRedirectTemp[1] = communityRedirect;
              communityRedirect.bgColor = THESES_BG;
              communityRedirect.textColor = 'black'
              break
            case OPEN_RESOURCES:
              communitiesRedirectTemp[2] = communityRedirect;
              communityRedirect.bgColor = OPEN_RESOURCE_BG;
              break;
            case PUBLICATIONS:
              communitiesRedirectTemp[0] = communityRedirect;
              communityRedirect.bgColor = PUBLICATIONS_BG;
          }
        });
        this.communitiesRedirect.next(communitiesRedirectTemp)
    });
  }

  protected readonly getCommunityPageRoute = getCommunityPageRoute;
}

export interface CommunityRedirect {
  uuid: string;
  name: string;
  bgColor: string;
  textColor: string;
}

