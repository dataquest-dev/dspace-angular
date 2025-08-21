import { Component, OnInit, Input } from '@angular/core';
import { UsageReport, Point } from 'src/app/core/statistics/models/usage-report.model';
import { UsageReportDataService } from 'src/app/core/statistics/usage-report-data.service';

/**
 * Interface representing the actual structure of point.values as returned by the API
 * This differs from the interface definition which shows it as an array (in usage-report.model.ts)
 */
interface PointValues {
  views: number;
  [key: string]: number; // Allow for other potential numeric properties
}

/**
 * Extended Point interface with correct values typing
 */
interface DownloadPoint extends Omit<Point, 'values'> {
  values: PointValues;
}

@Component({
  selector: 'ds-total-downloads',
  templateUrl: './total-downloads.component.html',
  styleUrls: ['./total-downloads.component.scss']
})
export class TotalDownloadsComponent implements OnInit {

  @Input() itemUuid: string;

  totalDownloads: number | null = null;

  label = 'item.page.files.downloads';

  constructor(private usageReportDataService: UsageReportDataService) {}

  ngOnInit(): void {
    if (this.itemUuid) {
      const reportType = 'TotalDownloads';
      this.usageReportDataService.getStatistic(this.itemUuid, reportType)
        .subscribe((report: UsageReport) => {
          // Type assertion to match the actual API response structure
          // The API returns values as an object, not an array as defined in the interface
          const points = report.points as unknown as DownloadPoint[];

          this.totalDownloads = points.reduce((total, point) => {
            const views = point.values.views || 0;
            return total + views;
          }, 0);
        });
    }
  }
}
