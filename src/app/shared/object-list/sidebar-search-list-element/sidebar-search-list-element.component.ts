import {
  AsyncPipe,
  NgClass,
} from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  Observable,
  of,
} from 'rxjs';
import {
  find,
  map,
} from 'rxjs/operators';

import { DSONameService } from '../../../core/breadcrumbs/dso-name.service';
import { LinkService } from '../../../core/cache/builders/link.service';
import { RemoteData } from '../../../core/data/remote-data';
import { ChildHALResource } from '../../../core/shared/child-hal-resource.model';
import { Context } from '../../../core/shared/context.model';
import { DSpaceObject } from '../../../core/shared/dspace-object.model';
import {
  hasValue,
  isNotEmpty,
} from '../../empty.util';
import { SearchResult } from '../../search/models/search-result.model';
import { TruncatableService } from '../../truncatable/truncatable.service';
import { TruncatablePartComponent } from '../../truncatable/truncatable-part/truncatable-part.component';
import { followLink } from '../../utils/follow-link-config.model';
import { SearchResultListElementComponent } from '../search-result-list-element/search-result-list-element.component';

@Component({
  selector: 'ds-sidebar-search-list-element',
  templateUrl: './sidebar-search-list-element.component.html',
  imports: [
    AsyncPipe,
    NgClass,
    TranslateModule,
    TruncatablePartComponent,
  ],
})
/**
 * Component displaying a list element for a {@link SearchResult} in the sidebar search modal
 * It displays the name of the parent, title and description of the object. All of which are customizable in the child
 * component by overriding the relevant methods of this component
 */
export class SidebarSearchListElementComponent<T extends SearchResult<K>, K extends DSpaceObject> extends SearchResultListElementComponent<T, K> implements OnInit, AfterViewInit {
  /**
   * Observable for the title of the parent object (displayed above the object's title)
   */
  parentTitle$: Observable<string>;

  /**
   * A description to display below the title
   */
  description: string;

  /**
   * Language of the description metadata value, used for the lang attribute.
   */
  descriptionLang: string | null = null;

  /**
   * True when at least one of the three truncatable parts is actually clipped, i.e. when the
   * expand-all control is worth rendering.
   */
  expandable = false;

  /**
   * True while the card is expanded by the expand-all control.
   */
  expanded = false;

  /**
   * Truncated state reported by each child truncatable part, keyed by its index.
   */
  private truncatedStates: Map<number, boolean> = new Map();

  /**
   * Remembers whether any child was ever truncated, so the collapse control stays available
   * once the card has been expanded (an expanded part no longer reports itself as truncated).
   */
  private initialTruncated = false;

  @ViewChildren(TruncatablePartComponent) truncatableComponents: QueryList<TruncatablePartComponent>;

  public constructor(protected truncatableService: TruncatableService,
                     protected linkService: LinkService,
                     public dsoNameService: DSONameService,
  ) {
    super(truncatableService, dsoNameService, null);
  }

  /**
   * Initialise the component variables
   */
  ngOnInit(): void {
    super.ngOnInit();
    if (hasValue(this.dso)) {
      this.parentTitle$ = this.getParentTitle();
      this.description = this.getDescription();
      this.descriptionLang = this.getDescriptionLang();
    }
  }

  ngAfterViewInit(): void {
    this.checkExpandableState();
  }

  /**
   * returns true if this element represents the current dso
   */
  isCurrent(): boolean {
    return this.context === Context.SideBarSearchModalCurrent;
  }

  /**
   * Get the title of the object's parent
   * Retrieve the parent by using the object's parent link and retrieving its 'dc.title' metadata
   */
  getParentTitle(): Observable<string> {
    return this.getParent().pipe(
      map((parentRD: RemoteData<DSpaceObject>) => {
        return hasValue(parentRD) && hasValue(parentRD.payload) ? this.dsoNameService.getName(parentRD.payload, true) : undefined;
      }),
    );
  }

  /**
   * Get the parent of the object
   */
  getParent(): Observable<RemoteData<DSpaceObject>> {
    if (typeof (this.dso as any).getParentLinkKey === 'function') {
      const propertyName = (this.dso as any).getParentLinkKey();
      return this.linkService.resolveLink(this.dso, followLink(propertyName))[propertyName].pipe(
        find((parentRD: RemoteData<ChildHALResource & DSpaceObject>) => parentRD.hasSucceeded || parentRD.statusCode === 204),
      );
    }
    return of(undefined);
  }

  /**
   * Get the description of the object
   * Default: "(dc.publisher, dc.date.issued) authors"
   */
  getDescription(): string {
    const publisher = this.firstMetadataValue('dc.publisher');
    const date = this.firstMetadataValue('dc.date.issued');
    const authors = this.allMetadataValues(['dc.contributor.author', 'dc.creator', 'dc.contributor.*']);
    let description = '';
    if (isNotEmpty(publisher) || isNotEmpty(date)) {
      description += '(';
    }
    if (isNotEmpty(publisher)) {
      description += publisher;
    }
    if (isNotEmpty(date)) {
      if (isNotEmpty(publisher)) {
        description += ', ';
      }
      description += date;
    }
    if (isNotEmpty(description)) {
      description += ') ';
    }
    if (isNotEmpty(authors)) {
      authors.forEach((author, i) => {
        description += author;
        if (i < (authors.length - 1)) {
          description += '; ';
        }
      });
    }
    return this.undefinedIfEmpty(description);
  }

  /**
   * Get the language of the description metadata value.
   * Override in subclasses to return the language of the displayed description.
   * Default: null (no lang attribute rendered)
   */
  getDescriptionLang(): string | null {
    return null;
  }

  /**
   * Return undefined if the provided string is empty
   * @param value Value to check
   */
  undefinedIfEmpty(value: string) {
    return this.defaultIfEmpty(value, undefined);
  }

  /**
   * Return a default value if the provided string is empty
   * @param value Value to check
   * @param def   Default in case value is empty
   */
  defaultIfEmpty(value: string, def: string) {
    if (isNotEmpty(value)) {
      return value;
    } else {
      return def;
    }
  }

  /**
   * Expand or collapse every truncatable part of this card at once.
   * @param event        the click that triggered it; stopped so the card itself is not opened
   * @param shouldExpand true to expand, false to collapse
   */
  toggleView(event: Event, shouldExpand: boolean) {
    event.stopPropagation();
    this.expanded = shouldExpand;
    if (this.truncatableComponents) {
      this.truncatableComponents.forEach(cmp => {
        cmp.toggle(event, shouldExpand);
      });
    }
  }

  /**
   * Handle truncated state change from a specific child component
   * @param index - The index of the truncatable component (1, 2, or 3)
   * @param isTruncated - Whether the component is truncated
   */
  onTruncatedStateChange(index: number, isTruncated: boolean): void {
    this.truncatedStates.set(index, isTruncated);
    if (isTruncated) {
      this.initialTruncated = true;
    }
    this.updateExpandableState();
  }

  /**
   * Update the expandable state based on truncated states
   */
  private updateExpandableState(): void {
    const anyTruncated = Array.from(this.truncatedStates.values()).some(state => state === true);
    const effectiveTruncated = (this.expanded && this.initialTruncated) ? true : anyTruncated;
    if (this.expandable !== effectiveTruncated) {
      setTimeout(() => this.expandable = effectiveTruncated, 0);
    }
  }

  /**
   * Force check of expandable state (used on initial load)
   */
  private checkExpandableState(): void {
    this.truncatedStates.clear();
    this.updateExpandableState();
  }
}
