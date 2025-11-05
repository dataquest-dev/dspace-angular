import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { formatInTimeZone }  from 'date-fns-tz';
import { isValid } from 'date-fns';
import isObject from 'lodash/isObject';
import { hasNoValue } from './empty.util';

/**
 * Get the configured display timezone from environment or fallback to browser timezone
 */
function getDisplayTimezone(): string {
  // Fallback to Europe/Bratislava as default for this application
  // In production, this should be injected via the TimezoneService
  return 'Europe/Bratislava';
}

/**
 * Returns true if the passed value is a NgbDateStruct.
 *
 * @param value
 *    The object to check
 * @return boolean
 *    true if the passed value is a NgbDateStruct, false otherwise
 */
export function isNgbDateStruct(value: object): boolean {
  return isObject(value) && value.hasOwnProperty('day')
    && value.hasOwnProperty('month') && value.hasOwnProperty('year');
}

/**
 * Returns a date in simplified extended ISO format (YYYY-MM-DDTHH:mm:ssZ).
 * The timezone is always zero UTC offset, as denoted by the suffix "Z"
 *
 * @param date
 *    The date to format
 * @return string
 *    the formatted date
 */
export function dateToISOFormat(date: Date | NgbDateStruct | string): string {
  const dateObj: Date = (date instanceof Date) ? date :
    ((typeof date === 'string') ? ngbDateStructToDate(stringToNgbDateStruct(date)) : ngbDateStructToDate(date));

  return formatInTimeZone(dateObj, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

/**
 * Returns a date formatted in the configured display timezone
 *
 * @param date The date to format
 * @param format The format string (date-fns format)
 * @param timezone Optional timezone override
 * @return string the formatted date in the display timezone
 */
export function dateToDisplayFormat(date: Date | NgbDateStruct | string, format: string = "yyyy-MM-dd'T'HH:mm:ss", timezone?: string): string {
  const dateObj: Date = (date instanceof Date) ? date :
    ((typeof date === 'string') ? ngbDateStructToDate(stringToNgbDateStruct(date)) : ngbDateStructToDate(date));
  
  const tz = timezone || getDisplayTimezone();
  return formatInTimeZone(dateObj, tz, format);
}

/**
 * Returns a Date object started from a NgbDateStruct object
 *
 * @param date
 *    The NgbDateStruct to convert
 * @return Date
 *    the Date object
 */
export function ngbDateStructToDate(date: NgbDateStruct): Date {
  return new Date(Date.UTC(date.year, (date.month - 1), date.day));
}

/**
 * Returns a NgbDateStruct object started from a string representing a date
 *
 * @param date
 *    The Date to convert
 * @return NgbDateStruct
 *    the NgbDateStruct object
 */
export function stringToNgbDateStruct(date: string): NgbDateStruct {
  return dateToNgbDateStruct(new Date(date));
}

/**
 * Returns a NgbDateStruct object started from a Date object
 *
 * @param date
 *    The Date to convert
 * @return NgbDateStruct
 *    the NgbDateStruct object
 */
export function dateToNgbDateStruct(date?: Date): NgbDateStruct {
  if (hasNoValue(date)) {
    date = new Date();
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

/**
 * Returns a NgbDateStruct object from a Date object using the display timezone
 *
 * @param date
 *    The Date to convert
 * @return NgbDateStruct
 *    the NgbDateStruct object in display timezone
 */
export function dateToNgbDateStructInTimezone(date?: Date): NgbDateStruct {
  if (hasNoValue(date)) {
    date = new Date();
  }

  // Format the date in the display timezone and parse it back to get local components
  const dateStr = formatInTimeZone(date, getDisplayTimezone(), 'yyyy-MM-dd');
  const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));

  return {
    year,
    month,
    day
  };
}

/**
 * Returns a date in simplified format (YYYY-MM-DD).
 *
 * @param date
 *    The date to format
 * @return string
 *    the formatted date
 */
export function dateToString(date: Date | NgbDateStruct): string {
  const dateObj: Date = (date instanceof Date) ? date : ngbDateStructToDate(date);
  return formatInTimeZone(dateObj, 'UTC', 'yyyy-MM-dd');
}

/**
 * Returns a date in simplified format (YYYY-MM-DD) in the display timezone.
 *
 * @param date
 *    The date to format
 * @return string
 *    the formatted date in display timezone
 */
export function dateToStringInTimezone(date: Date | NgbDateStruct): string {
  const dateObj: Date = (date instanceof Date) ? date : ngbDateStructToDate(date);
  return formatInTimeZone(dateObj, getDisplayTimezone(), 'yyyy-MM-dd');
}

/**
 * Checks if the given string represents a valid date
 * @param date the string to be checked
 */
export function isValidDate(date: string) {
  return (hasNoValue(date)) ? false : isValid(new Date(date));
}

/**
 * Parse given date string to a year number based on expected formats
 * @param date the string to be parsed
 * @param formats possible formats the string may align with. MUST be valid date-fns formats
 */
export function yearFromString(date: string) {
  return isValidDate(date) ? new Date(date).getUTCFullYear() : null;
}

