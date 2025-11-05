import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Custom date pipe that formats dates in the Bratislava timezone
 */
@Pipe({
  name: 'dateTimezone'
})
export class DateTimezonePipe implements PipeTransform {
  private datePipe = new DatePipe('en-US');
  private readonly timezone = 'Europe/Bratislava';

  transform(value: any, format?: string, timezone?: string): string | null {
    if (!value) {
      return null;
    }

    const tz = timezone || this.timezone;
    const formatStr = format || 'medium';

    try {
      const date = new Date(value);
      
      // Handle common Angular date pipe formats
      switch (formatStr) {
        case 'short':
          return formatInTimeZone(date, tz, 'd/M/yy, H:mm');
        case 'medium':
          return formatInTimeZone(date, tz, 'd MMM y, H:mm:ss');
        case 'long':
          return formatInTimeZone(date, tz, 'd MMMM y, H:mm:ss z');
        case 'full':
          return formatInTimeZone(date, tz, 'EEEE, d MMMM y, H:mm:ss zzzz');
        case 'shortDate':
          return formatInTimeZone(date, tz, 'd/M/yy');
        case 'mediumDate':
          return formatInTimeZone(date, tz, 'd MMM y');
        case 'longDate':
          return formatInTimeZone(date, tz, 'd MMMM y');
        case 'fullDate':
          return formatInTimeZone(date, tz, 'EEEE, d MMMM y');
        case 'shortTime':
          return formatInTimeZone(date, tz, 'H:mm');
        case 'mediumTime':
          return formatInTimeZone(date, tz, 'H:mm:ss');
        case 'longTime':
          return formatInTimeZone(date, tz, 'H:mm:ss z');
        case 'fullTime':
          return formatInTimeZone(date, tz, 'H:mm:ss zzzz');
        default:
          // Custom format string - use as is with date-fns-tz
          return formatInTimeZone(date, tz, formatStr);
      }
    } catch (error) {
      console.warn('DateTimezonePipe: Error formatting date', error);
      // Fallback to standard Angular DatePipe
      return this.datePipe.transform(value, format);
    }
  }
}