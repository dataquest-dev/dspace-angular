import { Pipe, PipeTransform } from '@angular/core';
import escape from 'lodash/escape';

@Pipe({ name: 'dsEmphasize' })
/**
 * Pipe for emphasizing a part of a string by surrounding it with <em> tags
 */
export class EmphasizePipe implements PipeTransform {
  /**
   * Characters that should be escaped
   */
  specials = [
    // order matters for these
    '-'
    , '['
    , ']'
    // order doesn't matter for any of these
    , '/'
    , '{'
    , '}'
    , '('
    , ')'
    , '*'
    , '+'
    , '?'
    , '.'
    , '\\'
    , '^'
    , '$'
    , '|'
  ];
  /**
   * Regular expression for escaping the string we're trying to find
   */
  regex = RegExp('[' + this.specials.join('\\') + ']', 'g');

  /**
   *
   * @param haystack The string which we want to partly highlight
   * @param needle The string that should become emphasized in the haystack string
   * @returns {any} Transformed haystack with the needle emphasized
   */
  transform(haystack, needle): any {
    const reg = new RegExp('(' + this.escapeRegExp(needle) + ')', 'gi');
    // The matches are the odd parts. Everything is escaped, so the <em> tags are the only HTML.
    return haystack.split(reg)
      .map((part, i) => i % 2 === 0 ? escape(part) : '<em>' + escape(part) + '</em>')
      .join('');
  }

  /**
   *
   * @param str Escape special characters in the string we're looking for
   * @returns {any} The escaped version of the input string
   */
   escapeRegExp(str) {
    return str.replace(this.regex, '\\$&');
  }
}
