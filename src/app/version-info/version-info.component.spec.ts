import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VersionInfoComponent } from './version-info.component';
import { VersionInfoDataService } from '../core/data/clarin/version-info-data.service';
import { VersionInfo } from '../core/shared/clarin/version-info.model';
import { createSuccessfulRemoteDataObject$ } from '../shared/remote-data.utils';

describe('VersionInfoComponent', () => {
  let component: VersionInfoComponent;
  let fixture: ComponentFixture<VersionInfoComponent>;

  const mockVersionInfo = Object.assign(new VersionInfo(), {
    date: '1.1.1999',
    buildRunUrl: '1234:2223',
    commitHash: '5678'
  });

  let versionInfoService: VersionInfoDataService;
  beforeEach(async () => {
    versionInfoService = jasmine.createSpyObj('VersionInfoDataService', {
      getVersions: createSuccessfulRemoteDataObject$(mockVersionInfo)
    });

    await TestBed.configureTestingModule({
      declarations: [ VersionInfoComponent ],
      providers: [
        { VersionInfoDataService, useValue: versionInfoService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VersionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
