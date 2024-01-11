<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
import { ContextHelpService } from '../../shared/context-help.service';
import { Observable } from 'rxjs';
=======
import { Component, OnInit, ElementRef } from '@angular/core';
import { ContextHelpService } from '../../shared/context-help.service';
import { Observable, Subscription } from 'rxjs';
>>>>>>> dspace-7.6.1
import { map } from 'rxjs/operators';

/**
 * Renders a "context help toggle" button that toggles the visibility of tooltip buttons on the page.
 * If there are no tooltip buttons available on the current page, the toggle is unclickable.
 */
@Component({
  selector: 'ds-context-help-toggle',
  templateUrl: './context-help-toggle.component.html',
  styleUrls: ['./context-help-toggle.component.scss']
})
export class ContextHelpToggleComponent implements OnInit {
  buttonVisible$: Observable<boolean>;

<<<<<<< HEAD
  constructor(
    private contextHelpService: ContextHelpService,
  ) { }

  ngOnInit(): void {
    this.buttonVisible$ = this.contextHelpService.tooltipCount$().pipe(map(x => x > 0));
=======
  subscriptions: Subscription[] = [];

  constructor(
    protected elRef: ElementRef,
    protected contextHelpService: ContextHelpService,
  ) {
  }

  ngOnInit(): void {
    this.buttonVisible$ = this.contextHelpService.tooltipCount$().pipe(map(x => x > 0));
    this.subscriptions.push(this.buttonVisible$.subscribe((showContextHelpToggle: boolean) => {
      if (showContextHelpToggle) {
        this.elRef.nativeElement.classList.remove('d-none');
      } else {
        this.elRef.nativeElement.classList.add('d-none');
      }
    }));
>>>>>>> dspace-7.6.1
  }

  onClick() {
    this.contextHelpService.toggleIcons();
  }
}
