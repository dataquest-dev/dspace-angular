import { Component, OnInit, Input } from '@angular/core';
import { UsageReportDataService } from 'src/app/core/statistics/usage-report-data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Component that displays the total number of downloads for all bitstreams within a DSpace item.
 *
 * This component fetches download statistics for a given item using its UUID and aggregates
 * the download counts from all bitstreams associated with that item. The result is displayed
 * as a single total download count.
 */
@Component({
  selector: 'ds-total-downloads',
  templateUrl: './total-downloads.component.html',
  styleUrls: ['./total-downloads.component.scss']
})
export class TotalDownloadsComponent implements OnInit {

  /**
   * The UUID of the DSpace item for which to fetch download statistics.
   */
  @Input() itemUuid!: string;

  /**
   * The total number of downloads across all bitstreams for the item.
   * Defaults to 0 and will show 0 if no data is available or an error occurs.
   */
  totalDownloads: number = 0;

  /**
   * The translation key for the downloadsLabel displayed alongside the download count.
   */
  readonly downloadsLabel = 'item.page.files.downloads';


  constructor(private usageReportDataService: UsageReportDataService) { }

  /**
   * Fetches the total download statistics for the item specified by itemUuid.
   * The component will:
   * 1. Call the UsageReportDataService with the item UUID and 'TotalDownloads' report type
   * 2. Aggregate all download counts (views) from all bitstreams in the response
   * 3. Set the totalDownloads property with the sum
   * 4. Handle errors gracefully by setting totalDownloads to 0 and logging the error
   *
   * @throws Will log an error to console if the API call fails, but won't throw an exception
   */
  ngOnInit(): void {
    if (!this.itemUuid) {
      return;
    }

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
          this.totalDownloads = 0; // Show 0 instead of null when no data is available
        }
      });
  }
}
