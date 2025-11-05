import {Pipe, PipeTransform} from '@angular/core';
import {NgbDateStruct} from '@ng-bootstrap/ng-bootstrap/datepicker/ngb-date-struct';
import { dateToNgbDateStructInTimezone } from '../../date.util';

@Pipe({
  // eslint-disable-next-line @angular-eslint/pipe-prefix
  name: 'toDate',
  pure: false
})
export class ToDatePipe implements PipeTransform {
  transform(dateValue: string | null): NgbDateStruct | null {
    if (!dateValue) {
      return null;
    }

    const date = new Date(dateValue);
    // Use timezone-aware conversion to properly handle dates in Bratislava timezone
    return dateToNgbDateStructInTimezone(date);
  }

}
