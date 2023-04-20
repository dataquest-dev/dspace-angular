import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {DsDynamicAutocompleteComponent} from '../autocomplete/ds-dynamic-autocomplete.component';
import {VocabularyService} from '../../../../../../core/submission/vocabularies/vocabulary.service';
import {DynamicFormLayoutService, DynamicFormValidationService} from '@ng-dynamic-forms/core';
import {MetadataValueDataService} from '../../../../../../core/data/metadata-value-data.service';
import {LookupRelationService} from '../../../../../../core/data/lookup-relation.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'ds-clarin-name',
  templateUrl: './clarin-name.component.html',
  styleUrls: ['./clarin-name.component.scss']
})
export class ClarinNameComponent extends DsDynamicAutocompleteComponent implements OnInit {

  constructor(protected vocabularyService: VocabularyService,
              protected cdr: ChangeDetectorRef,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService,
              protected metadataValueService: MetadataValueDataService,
              protected lookupRelationService: LookupRelationService,
              protected translateService: TranslateService) {
    super(vocabularyService, cdr, layoutService, validationService, metadataValueService,
      lookupRelationService);
  }

  ngOnInit(): void {
    console.log('I am here');
  }

}
