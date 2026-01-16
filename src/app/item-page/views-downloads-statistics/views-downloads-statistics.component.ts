import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartData, FileStatistic, StatsData, ViewsDownloadsStatisticsService, YearlyFileStats } from './views-downloads-statistics.service';
import { filter, Subscription, take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { RemoteData } from 'src/app/core/data/remote-data';
import { Item } from 'src/app/core/shared/item.model';
import { ChartDrawerService } from './chart-drawer.service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'ds-views-downloads-statistics',
  templateUrl: './views-downloads-statistics.component.html',
  styleUrls: ['./views-downloads-statistics.component.scss']
})
export class ViewsDownloadsStatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  selectedYear: string | undefined = undefined;
  selectedMonth: string | undefined = undefined;
  activeMetric: 'views' | 'downloads' = 'views';

  currentData: ChartData[] = [];
  fileStats: FileStatistic[] = [];
  yearlyFileStats: YearlyFileStats[] = [];

  loading = false;
  error: string | null = null;

  item: Item;
  itemHandle: string;

  subscriptions: Subscription[] = [];

  constructor(
    private statsService: ViewsDownloadsStatisticsService,
    private route: ActivatedRoute,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private chartDrawer: ChartDrawerService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.data.pipe(
        filter((data) => data?.dso),
        take(1)
      ).subscribe((data) => {
        const itemRD: RemoteData<Item> = data.dso;
        if (itemRD?.hasSucceeded && itemRD?.payload) {
          this.item = itemRD.payload;
          this.itemHandle = this.item.handle;
          this.fetchData();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  fetchData(year?: string, month?: string) {
    if (!this.itemHandle) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.subscriptions.push(
      this.statsService.getStats(this.itemHandle, year, month).subscribe({
        next: (data: StatsData) => {
          this.currentData = data.chartData;
          this.fileStats = data.fileStats;
          this.yearlyFileStats = data.yearlyFileStats;
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.drawChart(), 0);
        },
        error: () => {
          this.error = this.translate.instant('statistics.views-downloads.error');
          this.loading = false;
          this.cdr.detectChanges();
        }
      })
    );
  }

  onDataPointClick(event: ChartData): void {
    if (!this.selectedYear) {
      this.selectedYear = event.period;
      this.cdr.detectChanges();
      this.fetchData(this.selectedYear);
    } else if (!this.selectedMonth) {
      this.selectedMonth = event.period;
      this.cdr.detectChanges();
      this.fetchData(this.selectedYear, this.selectedMonth);
    }
  }

  onBack(): void {
    if (this.selectedMonth) {
      this.selectedMonth = undefined;
      this.cdr.detectChanges();
      this.fetchData(this.selectedYear);
    } else if (this.selectedYear) {
      this.selectedYear = undefined;
      this.cdr.detectChanges();
      this.fetchData();
    }
  }

  selectMetric(metric: 'views' | 'downloads'): void {
    this.activeMetric = metric;
    setTimeout(() => this.drawChart(), 0);
  }

  getTitle(): string {
    if (this.selectedMonth) {
      return this.translate.instant('statistics.views-downloads.title.daily', {
        month: this.getMonthName(this.selectedMonth),
        year: this.selectedYear
      });
    } else if (this.selectedYear) {
      return this.translate.instant('statistics.views-downloads.title.monthly', {
        year: this.selectedYear
      });
    }
    return this.translate.instant('statistics.views-downloads.title.yearly');
  }

  getYearLabel(): string {
    if (this.selectedMonth) {
      return `${this.getMonthName(this.selectedMonth)}`;
    } else if (this.selectedYear) {
      return this.translate.instant('statistics.views-downloads.all-months');
    }
    return this.translate.instant('statistics.views-downloads.all-years');
  }

  getYearRange(): string {
    if (this.selectedYear) {
      return this.selectedYear;
    }
    if (this.currentData.length > 0) {
      const years = this.currentData.map(d => d.period).sort();
      return `${years[0]} - ${years[years.length - 1]}`;
    }
    return '';
  }

  /**
   * Calculate total views from the current data array
   * @returns The sum of all views in currentData
   */
  getTotalViews(): number {
    return this.currentData.reduce((sum, d) => sum + d.views, 0);
  }

  /**
   * Calculates total downloads from the current data array
   * @returns The sum of all downloads in currentData
   */
  getTotalDownloads(): number {
    return this.currentData.reduce((sum, d) => sum + d.downloads, 0);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  private getMonthName(month: string): string {
    const monthKeys = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < monthKeys.length) {
      return this.translate.instant(`statistics.views-downloads.months.${monthKeys[monthIndex]}`);
    }
    return month;
  }

  backToItem(): void {
    this.location.back();
  }

  drawChart(): void {
    if (!this.chartContainer) {
      return;
    }

    this.chartDrawer.drawChart(
      this.chartContainer.nativeElement,
      this.currentData,
      this.activeMetric,
      (data: ChartData) => this.onDataPointClick(data),
      !!this.selectedMonth
    );
  }
}
