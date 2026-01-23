import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';

export interface ApiResponse {
  response: {
    views: {
      [year: string]: any;
      total: any;
    };
    downloads: {
      [year: string]: any;
      total: any;
    }
  }
}

export interface ChartData {
  period: string;
  views: number;
  downloads: number;
}

export interface FileStatistic {
  filename: string;
  count: number;
}

export interface YearlyFileStats {
  year: string;
  files: FileStatistic[];
}

export interface StatsData {
  chartData: ChartData[];
  fileStats: FileStatistic[];
  yearlyFileStats: YearlyFileStats[];
  rawResponse: ApiResponse;
}

@Injectable({
  providedIn: 'root'
})
export class ViewsDownloadsStatisticsService {
  private baseUrl: string;
  private endpoint: string;

  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private appConfig: AppConfig
  ) {
    console.log('Statistics Config:', this.appConfig.statistics);
    this.baseUrl = this.appConfig.statistics?.baseUrl;
    this.endpoint = this.appConfig.statistics?.endpoint;
  }

  getStats(handle: string, year?: string, month?: string): Observable<StatsData>{
    let url =  `${this.baseUrl}${this.endpoint}?h=${handle}`;
    if (year) {
      url += `&date=${year}`;
      if (month){
        url += `-${month}`;
      }
    }

    return this.http.get<ApiResponse>(url).pipe(
      map(response => {
        const fileStatsResult = this.extractFileStats(response, year, month);
        return {
          chartData: this.transformData(response, year, month),
          fileStats: fileStatsResult.flat,
          yearlyFileStats: fileStatsResult.yearly,
          rawResponse: response
        };
      })
    );
  }

  private transformData(response: ApiResponse, year?: string, month?: string): ChartData[] {
    if (!year) {
      const keys = new Set([...Object.keys(response.response.views.total), ...Object.keys(response.response.downloads.total)]);
      const years = [...keys].filter((key) => key !== 'nb_hits' && key !== 'nb_visits' && key !== 'nb_uniq_visitors' && key !== 'nb_uniq_pageviews');
      return years.map((y) => ({
        period: y,
        views: response.response.views.total[y]?.nb_hits || 0,
        downloads: response.response.downloads.total[y]?.nb_hits || 0,
      })).sort((a, b) => a.period.localeCompare(b.period));
    }

    if (!month) {
      const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      return months.map((m) => ({
        period: m,
        views: response.response.views.total[year][m]?.nb_hits || 0,
        downloads: response.response.downloads.total[year][m]?.nb_hits || 0,
      })).sort((a, b) => Number(a.period) - Number(b.period));
    }

    const days = [...Array(new Date(Number(year), Number(month), 0).getDate()).keys()].map((x) => ((x + 1) + ''));
    return days.map((d) => ({
      period: d,
      views: response.response.views.total[year][month][d]?.nb_hits || 0,
      downloads: response.response.downloads.total[year][month][d]?.nb_hits || 0,
    })).sort((a, b) => Number(a.period) - Number(b.period));
  }

  private extractFileStats(response: ApiResponse, year?: string, month?: string): { flat: FileStatistic[], yearly: YearlyFileStats[] } {
    const downloadsData = response.response.downloads;

    const extractFilename = (url: string): string => {
      const parts = url.split('/');
      return parts[parts.length - 1];
    };

    const processTimePeriod = (periodData: any): Map<string, number> => {
      const fileMap = new Map<string, number>();
      if (!periodData) {
        return fileMap;
      }

      const processRecursive = (data: any) => {
        if (!data) {
          return;
        }

        Object.keys(data).forEach(key => {
          if (key === 'nb_hits' || key === 'nb_visits' || key === 'nb_uniq_visitors' || key === 'nb_uniq_pageviews') {
            return;
          }

          const value = data[key];

          if (typeof value === 'object' && value !== null && (key.includes('/') || key.includes('.'))) {
            const filename = extractFilename(key);
            const hits = value.nb_hits || 0;
            fileMap.set(filename, (fileMap.get(filename) || 0) + hits);
          } else if (typeof value === 'object') {
            processRecursive(value);
          }
        });
      };

      processRecursive(periodData);
      return fileMap;
    };

    const mapToArray = (fileMap: Map<string, number>): FileStatistic[] => {
      return Array.from(fileMap.entries())
        .map(([filename, count]) => ({ filename, count }))
        .sort((a, b) => b.count - a.count);
    };

    if (!year) {
      const yearlyStats: YearlyFileStats[] = [];
      const allYears = Object.keys(downloadsData)
        .filter(key => key !== 'total')
        .sort();

      allYears.forEach(yearKey => {
        if (downloadsData[yearKey]) {
          const fileMap = processTimePeriod(downloadsData[yearKey]);
          const files = mapToArray(fileMap);
          if (files.length > 0) {
            yearlyStats.push({ year: yearKey, files });
          }
        }
      });

      return { flat: [], yearly: yearlyStats };
    } else if (!month) {
      const fileMap = downloadsData[year] ? processTimePeriod(downloadsData[year]) : new Map();
      return { flat: mapToArray(fileMap), yearly: [] };
    } else {
      const fileMap = (downloadsData[year] && downloadsData[year][month])
        ? processTimePeriod(downloadsData[year][month])
        : new Map();
      return { flat: mapToArray(fileMap), yearly: [] };
    }
  }
}
