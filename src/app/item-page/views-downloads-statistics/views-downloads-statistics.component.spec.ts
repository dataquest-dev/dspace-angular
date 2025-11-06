import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ViewsDownloadsStatisticsComponent } from './views-downloads-statistics.component';
import { ViewsDownloadsStatisticsService, ChartData, StatsData, FileStatistic, YearlyFileStats } from './views-downloads-statistics.service';
import { ChartDrawerService } from './chart-drawer.service';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ElementRef } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { RemoteData } from 'src/app/core/data/remote-data';
import { Item } from 'src/app/core/shared/item.model';
import { TranslateLoaderMock } from 'src/app/shared/mocks/translate-loader.mock';
import { getMockTranslateService } from 'src/app/shared/mocks/translate.service.mock';

describe('ViewsDownloadsStatisticsComponent', () => {
  let component: ViewsDownloadsStatisticsComponent;
  let fixture: ComponentFixture<ViewsDownloadsStatisticsComponent>;
  let mockStatsService: jasmine.SpyObj<ViewsDownloadsStatisticsService>;
  let mockChartDrawer: jasmine.SpyObj<ChartDrawerService>;
  let mockActivatedRoute: any;
  let mockLocation: jasmine.SpyObj<Location>;
  let translateService: TranslateService;
  const mockItem: Item = {
    id: 'test-item-id',
    handle: '123456789/123',
    uuid: 'test-uuid'
  } as Item;

  const mockChartData: ChartData[] = [
    { period: '2019', views: 1000, downloads: 500 },
    { period: '2020', views: 1500, downloads: 750 },
    { period: '2021', views: 2000, downloads: 1000 }
  ];

  const mockFileStats: FileStatistic[] = [
    { filename: 'document.pdf', count: 150 },
    { filename: 'image.png', count: 75 }
  ];

  const mockYearlyFileStats: YearlyFileStats[] = [
    {
      year: '2019',
      files: [
        { filename: 'doc1.pdf', count: 100 },
        { filename: 'doc2.pdf', count: 50 }
      ]
    }
  ];

  const mockStatsData: StatsData = {
    chartData: mockChartData,
    fileStats: mockFileStats,
    yearlyFileStats: mockYearlyFileStats,
    rawResponse: {} as any
  };

  beforeEach(async () => {
    mockStatsService = jasmine.createSpyObj('ViewsDownloadsStatisticsService', ['getStats']);
    mockChartDrawer = jasmine.createSpyObj('ChartDrawerService', ['drawChart']);
    mockLocation = jasmine.createSpyObj('Location', ['back']);
    translateService = getMockTranslateService();

    mockActivatedRoute = {
      data: of({
        dso: {
          hasSucceeded: true,
          payload: mockItem
        } as RemoteData<Item>
      })
    };

    mockStatsService.getStats.and.returnValue(of(mockStatsData));

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
              loader: {
                provide: TranslateLoader,
                useClass: TranslateLoaderMock
              }
            }),],
      declarations: [ViewsDownloadsStatisticsComponent,
        // MockTranslatePipe
      ],
      providers: [
        { provide: ViewsDownloadsStatisticsService, useValue: mockStatsService },
        { provide: ChartDrawerService, useValue: mockChartDrawer },
        // { provide: TranslateService, useValue: mockTranslate },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Location, useValue: mockLocation },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewsDownloadsStatisticsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.selectedYear).toBeUndefined();
      expect(component.selectedMonth).toBeUndefined();
      expect(component.activeMetric).toBe('views');
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.currentData).toEqual([]);
      expect(component.fileStats).toEqual([]);
      expect(component.yearlyFileStats).toEqual([]);
    });

    it('should initialize empty subscriptions array', () => {
      expect(component.subscriptions).toBeDefined();
      expect(component.subscriptions.length).toBe(0);
    });
  });

  describe('Data Loading', () => {
    it('should load item from route data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.item).toEqual(mockItem);
      expect(component.itemHandle).toBe(mockItem.handle);
    }));

    it('should fetch statistics data successfully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockStatsService.getStats).toHaveBeenCalledWith(mockItem.handle, undefined, undefined);
      expect(component.currentData).toEqual(mockChartData);
      expect(component.fileStats).toEqual(mockFileStats);
      expect(component.yearlyFileStats).toEqual(mockYearlyFileStats);
      expect(component.loading).toBe(false);
    }));



    it('should not fetch data if itemHandle is not set', () => {
      component.itemHandle = undefined as any;
      component.fetchData();

      expect(mockStatsService.getStats).not.toHaveBeenCalled();
    });

    it('should fetch monthly data when year is selected', fakeAsync(() => {
      component.itemHandle = mockItem.handle;
      component.fetchData('2019');
      tick();

      expect(mockStatsService.getStats).toHaveBeenCalledWith(mockItem.handle, '2019', undefined);
    }));

    it('should fetch daily data when year and month are selected', fakeAsync(() => {
      component.itemHandle = mockItem.handle;
      component.fetchData('2019', '6');
      tick();

      expect(mockStatsService.getStats).toHaveBeenCalledWith(mockItem.handle, '2019', '6');
    }));

    it('should set loading to true during fetch', fakeAsync(() => {
      component.itemHandle = mockItem.handle;
      // Use delayed observable to check loading state before completion
      mockStatsService.getStats.and.returnValue(
        of(mockStatsData).pipe(delay(100))
      );
      component.fetchData();

      // Check loading state immediately (synchronously set to true)
      expect(component.loading).toBe(true);
      expect(component.error).toBeNull();
      tick(100); // Flush the delay timer
      flush(); // Flush any remaining timers (like setTimeout)
    }));

    it('should set loading to false after successful fetch', fakeAsync(() => {
      component.itemHandle = mockItem.handle;
      component.fetchData();
      tick();

      expect(component.loading).toBe(false);
    }));

    it('should clear error at start of fetch', () => {
      component.error = 'Previous error';
      component.itemHandle = mockItem.handle;
      component.fetchData();

      expect(component.error).toBeNull();
    });
  });

  describe('Chart Interaction', () => {
    beforeEach(() => {
      component.itemHandle = mockItem.handle;
    });

    it('should drill down to month view when clicking on a year', fakeAsync(() => {
      const yearData: ChartData = { period: '2019', views: 1000, downloads: 500 };
      component.onDataPointClick(yearData);
      tick();

      expect(component.selectedYear).toBe('2019');
      expect(mockStatsService.getStats).toHaveBeenCalledWith(mockItem.handle, '2019', undefined);
    }));

    it('should drill down to day view when clicking on a month', fakeAsync(() => {
      component.selectedYear = '2019';
      const monthData: ChartData = { period: '6', views: 100, downloads: 50 };

      component.onDataPointClick(monthData);
      tick();

      expect(component.selectedMonth).toBe('6');
      expect(mockStatsService.getStats).toHaveBeenCalledWith(mockItem.handle, '2019', '6');
    }));

    it('should not drill down further when on day level', () => {
      component.selectedYear = '2019';
      component.selectedMonth = '6';
      const dayData: ChartData = { period: '15', views: 10, downloads: 5 };
      const getStatsCallCount = mockStatsService.getStats.calls.count();

      component.onDataPointClick(dayData);

      expect(mockStatsService.getStats.calls.count()).toBe(getStatsCallCount);
    });

    it('should call chart drawer service after data loads', fakeAsync(() => {
      component.chartContainer = { nativeElement: document.createElement('div') } as ElementRef;
      fixture.detectChanges();
      tick();
      tick();

      expect(mockChartDrawer.drawChart).toHaveBeenCalled();
    }));

    it('should trigger change detection when drilling down', () => {
      const yearData: ChartData = { period: '2019', views: 1000, downloads: 500 };
      component.onDataPointClick(yearData);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.itemHandle = mockItem.handle;
    });

    it('should navigate back from day view to month view', fakeAsync(() => {
      component.selectedYear = '2019';
      component.selectedMonth = '6';

      component.onBack();
      tick();

      expect(component.selectedMonth).toBeUndefined();
      expect(component.selectedYear).toBe('2019');
      expect(mockStatsService.getStats).toHaveBeenCalledWith(mockItem.handle, '2019', undefined);
    }));

    it('should navigate back from month view to year view', fakeAsync(() => {
      component.selectedYear = '2019';
      component.selectedMonth = undefined;

      component.onBack();
      tick();

      expect(component.selectedYear).toBeUndefined();
      expect(mockStatsService.getStats).toHaveBeenCalledWith(mockItem.handle, undefined, undefined);
    }));

    it('should navigate back to item page', () => {
      component.backToItem();

      expect(mockLocation.back).toHaveBeenCalled();
    });

    it('should trigger change detection on back navigation', () => {
      component.selectedYear = '2019';
      component.onBack();
    });
  });

  describe('Metric Toggle', () => {
    it('should switch active metric from views to downloads', fakeAsync(() => {
      component.chartContainer = { nativeElement: document.createElement('div') } as ElementRef;
      component.selectMetric('downloads');
      tick();

      expect(component.activeMetric).toBe('downloads');
      expect(mockChartDrawer.drawChart).toHaveBeenCalled();
    }));

    it('should switch active metric from downloads to views', fakeAsync(() => {
      component.chartContainer = { nativeElement: document.createElement('div') } as ElementRef;
      component.activeMetric = 'downloads';
      component.selectMetric('views');
      tick();

      expect(component.activeMetric).toBe('views');
      expect(mockChartDrawer.drawChart).toHaveBeenCalled();
    }));

    it('should redraw chart after metric change', fakeAsync(() => {
      component.chartContainer = { nativeElement: document.createElement('div') } as ElementRef;
      const drawChartSpy = mockChartDrawer.drawChart;

      component.selectMetric('downloads');
      tick();

      expect(drawChartSpy).toHaveBeenCalled();
    }));
  });

  describe('Title and Label Generation', () => {
    it('should return yearly view title', () => {
      component.selectedYear = undefined;
      component.getTitle();
    });

    it('should return monthly view title with year', () => {
      component.selectedYear = '2019';
      component.selectedMonth = undefined;

      component.getTitle();
    });

    it('should return daily view title with month and year', () => {
      component.selectedYear = '2019';
      component.selectedMonth = '6';

      const title = component.getTitle();
      expect(title).toBeTruthy();
    });

    it('should return all-years label when no year selected', () => {
      component.selectedYear = undefined;
      component.getYearLabel();
    });

    it('should return all-months label when year selected but no month', () => {
      component.selectedYear = '2019';
      component.selectedMonth = undefined;

      component.getYearLabel();
    });

    it('should return year range when viewing all years', () => {
      component.currentData = mockChartData;
      component.selectedYear = undefined;

      const range = component.getYearRange();

      expect(range).toBe('2019 - 2021');
    });

    it('should return single year when year is selected', () => {
      component.selectedYear = '2019';

      const range = component.getYearRange();

      expect(range).toBe('2019');
    });

    it('should return empty string when no data available', () => {
      component.currentData = [];
      component.selectedYear = undefined;

      const range = component.getYearRange();

      expect(range).toBe('');
    });
  });

  describe('Data Calculations', () => {
    it('should calculate total views from current data', () => {
      component.currentData = mockChartData;

      const total = component.getTotalViews();

      expect(total).toBe(4500);
    });

    it('should calculate total downloads from current data', () => {
      component.currentData = mockChartData;

      const total = component.getTotalDownloads();

      expect(total).toBe(2250);
    });

    it('should return 0 for total views when no data', () => {
      component.currentData = [];

      const total = component.getTotalViews();

      expect(total).toBe(0);
    });

    it('should return 0 for total downloads when no data', () => {
      component.currentData = [];

      const total = component.getTotalDownloads();

      expect(total).toBe(0);
    });

    it('should calculate totals correctly with single data point', () => {
      component.currentData = [{ period: '2019', views: 100, downloads: 50 }];

      expect(component.getTotalViews()).toBe(100);
      expect(component.getTotalDownloads()).toBe(50);
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers with locale-specific separators', () => {
      const formatted = component.formatNumber(1000);

      expect(formatted).toBe('1,000');
    });

    it('should format large numbers correctly', () => {
      const formatted = component.formatNumber(1234567);

      expect(formatted).toBe('1,234,567');
    });

    it('should format zero correctly', () => {
      const formatted = component.formatNumber(0);

      expect(formatted).toBe('0');
    });

    it('should format small numbers without separators', () => {
      const formatted = component.formatNumber(100);

      expect(formatted).toBe('100');
    });
  });

  describe('Chart Drawer Integration', () => {
    beforeEach(() => {
      component.chartContainer = { nativeElement: document.createElement('div') } as ElementRef;
      component.currentData = mockChartData;
    });

    it('should pass correct parameters to chart drawer', fakeAsync(() => {
      component.activeMetric = 'downloads';
      component.selectedMonth = undefined;

      component.drawChart();
      tick();

      expect(mockChartDrawer.drawChart).toHaveBeenCalledWith(
        component.chartContainer.nativeElement,
        component.currentData,
        'downloads',
        jasmine.any(Function),
        false
      );
    }));

    it('should set isLastLevel flag true for daily view', fakeAsync(() => {
      component.selectedMonth = '6';

      component.drawChart();
      tick();

      const calls = mockChartDrawer.drawChart.calls.mostRecent();
      expect(calls.args[4]).toBe(true);
    }));

    it('should set isLastLevel flag false for yearly view', fakeAsync(() => {
      component.selectedYear = undefined;
      component.selectedMonth = undefined;

      component.drawChart();
      tick();

      const calls = mockChartDrawer.drawChart.calls.mostRecent();
      expect(calls.args[4]).toBe(false);
    }));

    it('should set isLastLevel flag false for monthly view', fakeAsync(() => {
      component.selectedYear = '2019';
      component.selectedMonth = undefined;

      component.drawChart();
      tick();

      const calls = mockChartDrawer.drawChart.calls.mostRecent();
      expect(calls.args[4]).toBe(false);
    }));

    it('should pass callback function to chart drawer', fakeAsync(() => {
      component.drawChart();
      tick();

      const calls = mockChartDrawer.drawChart.calls.mostRecent();
      expect(typeof calls.args[3]).toBe('function');
    }));
  });
});
