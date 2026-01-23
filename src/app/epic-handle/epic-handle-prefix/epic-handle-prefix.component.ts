import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EpicHandleDataService } from '../../core/data/epic-handle-data.service';

@Component({
  selector: 'ds-epic-handle-prefix',
  templateUrl: './epic-handle-prefix.component.html',
  styleUrls: ['./epic-handle-prefix.component.scss']
})
export class EpicHandlePrefixComponent {
  // The prefix form
  prefixForm;

  constructor(private formBuilder: UntypedFormBuilder, private router: Router, private epicHandleDataService: EpicHandleDataService) {
    this.prefixForm = this.formBuilder.group(({
      prefix: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]]
    }));
  }

  navigateToEpicHandleList(data) {
    if (!data?.prefix) {
      return;
    }

    const trimmedPrefix = (data.prefix || '').trim();
    const isValidTrimmed = /^[a-zA-Z0-9]+$/.test(trimmedPrefix);

    if (isValidTrimmed) {
      this.router.navigate(['/epic-handle-table'], { queryParams: { prefix: trimmedPrefix}});
    }
  }

  /**
   * Check if the prefix field has an error
   */
  hasError(field: string, error: string): boolean {
    const control = this.prefixForm.get(field);
    return control && control.hasError(error) && (control.dirty || control.touched);
  }
}
