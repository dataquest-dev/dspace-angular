import {
  Component,
  Input,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { APP_CONFIG } from '../../../../../config/app-config.interface';
import { environment } from '../../../../../environments/environment.test';
import { Community } from '../../../../core/shared/community.model';
import { DSpaceObjectType } from '../../../../core/shared/dspace-object-type.model';
import { createSuccessfulRemoteDataObject } from '../../../remote-data.utils';
import { ThemedSearchComponent } from '../../../search/themed-search.component';
import { ActivatedRouteStub } from '../../../testing/active-router.stub';
import { ComcolSearchSectionComponent } from './comcol-search-section.component';

@Component({
  selector: 'ds-search',
  template: '',
})
class SearchStubComponent {
  @Input() configuration: string;
  @Input() context: string;
  @Input() searchEnabled: boolean;
  @Input() showSidebar: boolean;
  @Input() showScopeSelector: boolean;
  @Input() hideScopeInUrl: boolean;
  @Input() forcedDsoTypes: DSpaceObjectType[];
  @Input() scope: string;
}

describe('ComcolSearchSectionComponent', () => {
  let component: ComcolSearchSectionComponent;
  let fixture: ComponentFixture<ComcolSearchSectionComponent>;

  let route: ActivatedRouteStub;

  beforeEach(async () => {
    const community = Object.assign(new Community(), { id: 'test-community-id', type: 'community' });
    route = new ActivatedRouteStub();
    route.parent = new ActivatedRouteStub({}, { dso: createSuccessfulRemoteDataObject(community) });

    await TestBed.configureTestingModule({
      imports: [ComcolSearchSectionComponent],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        { provide: ActivatedRoute, useValue: route },
      ],
    })
      .overrideComponent(ComcolSearchSectionComponent, {
        remove: {
          imports: [ThemedSearchComponent],
        },
        add: {
          imports: [SearchStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ComcolSearchSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restrict the search to items only', () => {
    const search: SearchStubComponent = fixture.debugElement.query(By.directive(SearchStubComponent)).componentInstance;
    expect(search.forcedDsoTypes).toEqual([DSpaceObjectType.ITEM]);
    expect(search.scope).toBe('test-community-id');
  });
});
