import { Component, OnInit, Input } from '@angular/core';
import { UsageReportDataService } from 'src/app/core/statistics/usage-report-data.service';
import { ConfigurationDataService } from 'src/app/core/data/configuration-data.service';
import { catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

/**
 * Component that displays the total number of downloads for all bitstreams within a DSpace item.
 *
 * This component checks the 'item.view.total.downloads.enabled' configuration property
 * to determine if download statistics should be displayed. If enabled, it fetches download
 * statistics for a given item using its UUID and aggregates the download counts from all
 * bitstreams associated with that item. The result is displayed as a single total download count.
 *
 * If the configuration is disabled or set to 'false', the component will not be displayed.
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
  totalDownloads = 0;

  /**
   * Flag indicating whether the total downloads feature is enabled in the configuration.
   * Uses BehaviorSubject to allow reactive updates. Defaults to false and will only be
   * set to true if the configuration explicitly contains 'true' value.
   */
  totalDownloadsEnabled = new BehaviorSubject<boolean>(false);

  /**
   * The translation key for the downloadsLabel displayed alongside the download count.
   */
  readonly downloadsLabel = 'item.page.files.downloads';


  constructor(
    private usageReportDataService: UsageReportDataService,
    private configService: ConfigurationDataService
  ) { }

  /**
   * Fetches the configuration to check if total downloads should be shown,
   * and if enabled, fetches the total download statistics for the item specified by itemUuid.
   * The component will:
   * 1. Check the 'item.view.total.downloads.enabled' configuration property
   * 2. If enabled (configuration value is explicitly 'true'), call the UsageReportDataService
   *    If configuration is not found or fails to load, defaults to false (disabled)
   * 3. Aggregate all download counts (views) from all bitstreams in the response
   * 4. Set the totalDownloads property with the sum
   * 5. Handle errors gracefully by returning null and logging the error
   *
   * @throws Will log an error to console if the API call fails, but won't throw an exception
   */
  ngOnInit(): void {
    if (!this.itemUuid) {
      return;
    }

    // First, check if total downloads feature is enabled in configuration
    this.configService.findByPropertyName('item.view.total.downloads.enabled')
      .pipe(
        catchError(error => {
          console.error('Failed to fetch total downloads configuration:', error);
          // Default to false if configuration cannot be retrieved
          return of(null);
        })
      )
      .subscribe(configData => {
        // Extract configuration value, default to 'false' if not found
        const itemViewTotalDownloadsEnabled = configData?.payload?.values?.[0];
        this.totalDownloadsEnabled.next(itemViewTotalDownloadsEnabled === 'true');

        // Only fetch download statistics if the feature is enabled
        if (this.totalDownloadsEnabled.value) {
          this.fetchDownloadStatistics();
        } else {
          this.totalDownloads = null; // Ensure it's null when disabled
        }
      });
  }

  /**
   * Private method to fetch download statistics from the usage report service.
   * This method is called only when the total downloads feature is enabled.
   */
  private fetchDownloadStatistics(): void {
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
