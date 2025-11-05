import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../../config/app-config.interface';

/**
 * Service for handling timezone operations and configuration
 */
@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  
  constructor(@Inject(APP_CONFIG) private appConfig: AppConfig) {}

  /**
   * Get the configured display timezone
   * @returns string IANA timezone identifier
   */
  getDisplayTimezone(): string {
    return this.appConfig.timezone?.displayTimezone || this.getBrowserTimezone();
  }

  /**
   * Get the browser's detected timezone
   * @returns string IANA timezone identifier
   */
  getBrowserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'UTC';
    }
  }

  /**
   * Get the timezone offset in minutes for a specific date and timezone
   * @param date The date to get offset for
   * @param timezone The timezone (defaults to display timezone)
   * @returns number offset in minutes
   */
  getTimezoneOffset(date: Date = new Date(), timezone?: string): number {
    const tz = timezone || this.getDisplayTimezone();
    
    try {
      // Use Intl.DateTimeFormat to get timezone offset
      const utcDate = new Date(date.toISOString().slice(0, -1) + 'Z');
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
      return (utcDate.getTime() - tzDate.getTime()) / (1000 * 60);
    } catch (e) {
      return 0;
    }
  }
}