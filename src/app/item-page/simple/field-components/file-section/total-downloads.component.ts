import { Component, OnInit, Input } from '@angular/core';
import { UsageReportDataService } from 'src/app/core/statistics/usage-report-data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'ds-total-downloads',
  templateUrl: './total-downloads.component.html',
  styleUrls: ['./total-downloads.component.scss']
})
export class TotalDownloadsComponent implements OnInit {

  @Input() itemUuid!: string;

  totalDownloads: number | null = null;

  readonly label = 'item.page.files.downloads';

  constructor(private usageReportDataService: UsageReportDataService) {}

  ngOnInit(): void {
    if (this.itemUuid) {
      const reportType = 'TotalDownloads';
      this.usageReportDataService.getStatistic(this.itemUuid, reportType)
        .pipe(
          catchError(error => {
            console.error('Failed to fetch total downloads statistics:', error);
            return of(null);
          })
        )
        .subscribe(report => {
          if (report) {
            this.totalDownloads = report.points.reduce((total, point) => {
              const views = point.values.views || 0;
              return total + views;
            }, 0);
          } else {
            this.totalDownloads = null;
          }
        });
    }
  }
}
