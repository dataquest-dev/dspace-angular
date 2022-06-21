import {AUTOCOMPLETE_COMPLEX_PREFIX} from './dynamic-autocomplete.model';
import {SEPARATOR} from '../ds-dynamic-complex.model';

export class DynamicAutocompleteService {
  static removeAutocompletePrefix(formValue) {
    return formValue.value.replace(AUTOCOMPLETE_COMPLEX_PREFIX + SEPARATOR, '');
  }
}
