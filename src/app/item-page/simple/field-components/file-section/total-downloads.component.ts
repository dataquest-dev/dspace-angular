import { Component, OnInit, Input } from '@angular/core';
import { UsageReport } from 'src/app/core/statistics/models/usage-report.model';
import { UsageReportDataService } from 'src/app/core/statistics/usage-report-data.service';

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
          this.totalDownloads = report.points.reduce((total, point) => {
            const values = point.values as any;
            const views = values['views'] || values.views || 0;
            return total + views;
          }, 0);
        });
    }
  }
}
