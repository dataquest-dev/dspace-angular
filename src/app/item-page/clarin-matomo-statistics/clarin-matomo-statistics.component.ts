import {Component, OnInit, ViewChild} from '@angular/core';
import {Chart, ChartConfiguration, ChartDataSets, ChartOptions, ChartType} from 'chart.js';
import {BaseChartDirective, Label} from 'ng2-charts';
import {HttpClient} from '@angular/common/http';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';
import statYearPeriod from 'cache-statistics-period-year.json';
import statMonthPeriod from 'cache-statistics-period-month.json';
import statDayPeriod from 'cache-statistics-period-day.json';
import {isTokenRefreshing} from '../../core/auth/selectors';
import {isNull, isUndefined} from '../../shared/empty.util';
import {lastIndexOf} from 'lodash';
import {getDaysInHebrewMonth} from '@ng-bootstrap/ng-bootstrap/datepicker/hebrew/hebrew';
import {BehaviorSubject, range} from 'rxjs';

@Component({
  selector: 'ds-clarin-matomo-statistics',
  templateUrl: './clarin-matomo-statistics.component.html',
  styleUrls: ['./clarin-matomo-statistics.component.scss']
})
export class ClarinMatomoStatisticsComponent implements OnInit {

  constructor(protected http: HttpClient,
              private configurationService: ConfigurationDataService) {
  }

  // Month shortcut with full name
  public months = [
    ['Jan', 'January'],
    ['Feb', 'February'],
    ['Mar', 'March'],
    ['Apr', 'April'],
    ['May', 'May'],
    ['Jun', 'June'],
    ['Jul', 'July'],
    ['Aug', 'August'],
    ['Sep', 'September'],
    ['Oct', 'October'],
    ['Nov', 'November'],
    ['Dec', 'December']
  ];

  public periodMonth = 'month';
  public periodYear = 'year';
  public periodDay = 'day';

  public actualPeriod = '';
  private periodSequence = ['year', 'month', 'day'];

  public actualYear = '';
  public actualMonth = '';

  public chartMessage = '';

  @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;

  public chartLabels: Label[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // `lineTension: 0` = straight lines
  public chartData: ChartDataSets[] = [
    {data: [0,0,0,0,0,0,0,0,70, 65,	79, 86], label: 'Views', backgroundColor: '#9ee37d', borderColor: '#358600', pointBackgroundColor: '#1f6200',hidden: false, lineTension: 0},
    {data: [70, 65,	79, 86 ,0,0,0,0,0,0,0,0], label: 'Downloads', backgroundColor: '#51b9f2', borderColor: '#336ab5', pointBackgroundColor: '#124a94', hidden: false, lineTension: 0}
  ];

  public color = '#27496d';
  public chartOptions: ChartOptions = {
    isDoubleSideRounded: false,
    scales: {
      xAxes: [{
        gridLines: {
          color: this.color
        },
        ticks: {
          fontColor: '#00a8cc'
        },
      }],
      yAxes: [{
        gridLines: {
          color: this.color
        },
        ticks: {
          beginAtZero: true,
          fontColor: this.color
        }
      }]
    }
  };

  public viewsButtonClicked = true;
  public downloadsButtonClicked = true;

  public filesDownloads: BehaviorSubject<{ [name: string]: number }> = new BehaviorSubject({});


  ngOnInit(): void {
    this.actualPeriod = this.periodYear;
    this.fetchDataAndUpdateChart();
  }

  private getActualPeriodIndex() {
    let actualPeriodIndex = 0;
    this.periodSequence.forEach((per, index) => {
      if (per === this.actualPeriod) {
        actualPeriodIndex = index;
      }
    });
    return actualPeriodIndex;
  }

  back() {
    this.setToPreviousPeriod();
    this.fetchDataAndUpdateChart();
  }
  // 0 = year, 1 = month, 2 = day
  private setToPreviousPeriod() {
    let actualPeriodIndex = this.getActualPeriodIndex();
    console.log('seting to previous period, actual period is: ' + actualPeriodIndex);
    if (actualPeriodIndex === 0) {
      // The actual period is year period - there is no way back
      return;
    }

    this.actualPeriod = this.periodSequence[--actualPeriodIndex];
  }

  // 0 = year, 1 = month, 2 = day
  private setToNextPeriod() {
    let actualPeriodIndex = this.getActualPeriodIndex();
    console.log('actualPeriodIndex', actualPeriodIndex);
    if (actualPeriodIndex === 2 ) {
      // The actual period is year period - there is no way back
      return;
    }

    this.actualPeriod = this.periodSequence[++actualPeriodIndex];
    console.log('set period', this.actualPeriod);
  }

  // Hide/Show the dataset
  toggleDownload() {
    const index = 1;
    this.toggleDatasetHidden(index);
    this.downloadsButtonClicked = !this.downloadsButtonClicked;
  }

  toggleViews() {
    const index = 0;
    this.toggleDatasetHidden(index);
    this.viewsButtonClicked = !this.viewsButtonClicked;
  }

  toggleDatasetHidden(index) {
    this.chart.datasets[index].hidden = !this.chart.datasets[index].hidden;
    this.chart.update();
  }

  generateNumber(): number {
    return Math.floor((Math.random()));
  }

  chartClicked({ event, active }: { event?: ChartEvent, active?: {}[] }): void {
    console.log('event', event);
    console.log('active', active);
    const clickedLabelIndex = active[0]?._index;

    // The label value wasn;t clicked
    if (isUndefined(clickedLabelIndex)) {
      return;
    }
    console.log('clickedLabelIndex', clickedLabelIndex);
    const labelValue = this.chartLabels[clickedLabelIndex];

    console.log('clicked value: ', labelValue);

    this.setToNextPeriod();
    this.fetchDataAndUpdateChart(labelValue);
  }

  fetchAndProcessYearsStatistics() {
    // TODO API call
    const response = statYearPeriod?.response;

    // Get views
    const views = response?.views;
    // Get downloads
    const downloads = response?.downloads;

    // Get labels - year values
    const labelYears = Object.keys(views);

    // If the item has statistics only for one year show the month statistics
    if (labelYears.length === 1) {
      this.setToNextPeriod();
      this.fetchDataAndUpdateChart();
    }

    // Remove `total` from views and downloads
    const totalIndex = labelYears.indexOf('total');
    labelYears.splice(totalIndex, 1);

    // Get views data
    const totalDataViews = [];
    Object.values(views?.total).forEach((viewData: {}) => {
      // console.log('viewData', viewData);
      // Get only years data
      // @ts-ignore
      if (isUndefined(viewData?.nb_hits)) {
        return;
      }
      // @ts-ignore
      totalDataViews.push(viewData?.nb_hits);
    });

    // Get downloads data
    const totalDataDownloads = [];
    Object.values(downloads?.total).forEach((downloadData: {}) => {
      // console.log('downloadData', downloadData);
      // Get only years data
      // @ts-ignore
      if (isUndefined(downloadData?.nb_hits)) {
        return;
      }
      // @ts-ignore
      totalDataDownloads.push(downloadData?.nb_hits);
    });

    // Get download files data
    // Go through download statistics and count occurrences of the file downloading
    let filesDownloads: { [name: string]: number } = {};
    const filesDownloadsResponse = response.downloads;
    Object.keys(filesDownloadsResponse).forEach(year => {
      const yearDownloadFilesData = filesDownloadsResponse[year];
      if (year === 'total') {
        return;
      }
      Object.keys(yearDownloadFilesData).forEach(fileName => {
        // console.log('filesDownloads[fileName]', filesDownloads[fileName]);
        const shortenedFileName = this.getFileNameFromFullURI(fileName);
        const actualValue = isUndefined(filesDownloads[shortenedFileName]) ? 0 : filesDownloads[shortenedFileName];
        filesDownloads[shortenedFileName] = actualValue + yearDownloadFilesData[fileName].nb_hits;
      });
    });

    filesDownloads = this.sortByValue(filesDownloads);
    this.filesDownloads.next(filesDownloads);
    this.updateChartData(labelYears, totalDataViews, totalDataDownloads);
  }

  getFileNameFromFullURI(fileName) {
    if (isUndefined(fileName)) {
      return undefined;
    }
    // Shortened file name
    return fileName.substr(fileName.lastIndexOf('/') + 1, fileName.indexOf('handle/'));
  }

  sortByValue(dictionary) {
    const sortedData: { [name: string]: number } = {};
    Object.keys(dictionary)
      .sort((a, b) => (dictionary[a] < dictionary[b] ? 1 : -1))
      .map(x => {
        sortedData[x] = dictionary[x];
      });
    return sortedData;
  }

  fetchAndProcessMonthsStatistics() {
    // TODO API call
    const response = statMonthPeriod?.response;

    // Get views
    const views = response?.views;
    // Get downloads
    const downloads = response?.downloads;

    // Get month labels
    const monthLabels = [];
    // Month are in the format `[['Feb', 'February']]
    this.months.forEach(monthArray => {
      // Add shortcut of the the month to the label.
      monthLabels.push(monthArray[0]);
    });

    // Get views data
    const totalDataViews = [];
    const totalDataDownloads = [];
    console.log('actual year', this.actualYear);
    const viewsForActualYear = views?.total?.[this.actualYear];
    const downloadsForActualYear = downloads?.total?.[this.actualYear];
    this.months.forEach((month, index) => {
      // The months are indexed from 1 to 12, not from 0 to 11
      let increasedIndex = index;
      increasedIndex++;

      // View Data
      const monthViewData = viewsForActualYear?.['' + increasedIndex];
      if (isUndefined(monthViewData) || isUndefined(monthViewData?.nb_hits)) {
        totalDataViews.push(0);
      } else {
        // @ts-ignore
        totalDataViews.push(monthViewData?.nb_hits);
      }
      // console.log('viewData', monthViewData);

      // Download Data
      const monthDownloadData = downloadsForActualYear?.['' + increasedIndex];
      if (isUndefined(monthDownloadData) || isUndefined(monthDownloadData?.nb_hits)) {
        totalDataDownloads.push(0);
      } else {
        // @ts-ignore
        totalDataDownloads.push(monthDownloadData?.nb_hits);
      }
      // console.log('downloadData', monthDownloadData);
    });

    this.updateChartData(monthLabels, totalDataViews, totalDataDownloads);
  }

  fetchAndProcessDaysStatistics() {
    // TODO API call
    const response = statDayPeriod?.response;

    // Get views
    // console.log('this.getActualMonthIndex()', this.getActualMonthIndex());
    let actualMonthIndex: number = this.getActualMonthIndex();
    const actualDayViews = response.views?.total?.[this.actualYear]?.['' + actualMonthIndex];
    const actualDayDownloads = response.downloads?.total?.[this.actualYear]?.['' + actualMonthIndex];
    if (isUndefined(actualDayViews)) {
      // TODO show error notification
      return;
    }

    // console.log('getDaysInHebrewMonth(this.actualYear, --actualMonthIndex)', getDaysInHebrewMonth(this.actualYear, --actualMonthIndex));
    const daysOfActualMonth = new Date(this.actualYear, --actualMonthIndex, 0).getDate();
    // console.log('daysOfActualMonth', daysOfActualMonth);

    const totalDataViews = [];
    const totalDataDownloads = [];
    const daysArray = [...Array(daysOfActualMonth).keys()];

    daysArray.forEach(day => {
      // Days are indexed from 1 to 31, not from 0
      let dayIndex = day;
      dayIndex++;

      // View Data
      const dayViewData = actualDayViews?.['' + dayIndex];
      if (isUndefined(dayViewData) || isUndefined(dayViewData?.nb_hits)) {
        totalDataViews.push(0);
      } else {
        // @ts-ignore
        totalDataViews.push(dayViewData?.nb_hits);
      }

      // Download Data
      const dayDownloadData = actualDayDownloads?.['' + dayIndex];
      if (isUndefined(dayDownloadData) || isUndefined(dayDownloadData?.nb_hits)) {
        totalDataDownloads.push(0);
      } else {
        // @ts-ignore
        totalDataDownloads.push(dayDownloadData?.nb_hits);
      }

      // console.log('viewData', dayViewData);
    });
    // console.log('actualDayViews', actualDayViews);
    // console.log('totalDataViews', totalDataViews);
    // console.log('totalDataDownloads', totalDataDownloads);

    // Get downloads
    const downloads = response?.downloads;


    const dayLabels = [];
    console.log('actual month: ' + this.actualMonth);
    this.updateChartData(daysArray, totalDataViews, totalDataDownloads);
  }

  getActualMonthIndex(): number {
    let actualMonthIndex = 0;
    this.months.forEach((month, index) => {
      if (month[0] === this.actualMonth) {
        actualMonthIndex = index;
      }
    });

    // The month is index from 1 to 12, not from 0 to 11
    actualMonthIndex++;
    return actualMonthIndex;
  }

  fetchDataAndUpdateChart(labelValue) {
    const apiURL = 'https://api.agify.io/?name=bella';
    // this.http.get('http://api.ipify.org/?format=json').subscribe((res: any) => {
    //
    // });

    switch (this.actualPeriod) {
      case this.periodYear:
        console.log('year period');
        this.fetchAndProcessYearsStatistics();
        break;
      case this.periodMonth:
        this.actualYear = isUndefined(labelValue) ? this.actualYear : labelValue;
        console.log('month period');
        this.fetchAndProcessMonthsStatistics();
        break;
      case this.periodDay:
        this.actualMonth = labelValue;
        console.log('day period');
        this.fetchAndProcessDaysStatistics();
        break;
      default:
        this.fetchAndProcessYearsStatistics();
        break;
    }
    console.log('res', statYearPeriod.response);
  }

  updateChartMessage(labels) {
    const actualPeriodIndex = this.getActualPeriodIndex();

    this.chartMessage = '';
    // Show years interval
    if (actualPeriodIndex === 0) {
      // Start year and end year
      let lastIndexOfLabels = labels.length;
      this.chartMessage += labels[0] + ' - ' + labels[--lastIndexOfLabels];
    } else if (actualPeriodIndex === 1) {
      this.chartMessage += this.actualYear;
      console.log('Set actual month to:' + this.actualMonth);
    } else {
      this.chartMessage += this.actualMonth + ', ' + this.actualYear;
    }
  }

  updateChartData(labels, totalDataViews, totalDataDownloads) {
    // Update labels
    this.removeLabels();
    this.setLabels(labels);

    console.log('labels', this.chartLabels);
    // Update chart message e.g., `Statistics for years 2022 to 2023`, `Statistics for the year 2022`,..
    this.updateChartMessage(labels);

    // Update view data
    this.chartData[0]?.data = totalDataViews;
    // Update downloads data
    this.chartData[1]?.data = totalDataDownloads;
    this.chart.update();
  }

  setLabels(labels) {
    labels.forEach(label => {
      this.chartLabels.push(label);
    });
  }

  removeLabels() {
    this.chartLabels = [];
  }
}
