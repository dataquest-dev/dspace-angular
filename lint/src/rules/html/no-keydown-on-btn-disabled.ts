import { TmplAstElement } from '@angular-eslint/bundled-angular-compiler';
import { TemplateParserServices } from '@angular-eslint/utils';
import {
  ESLintUtils,
  TSESLint,
} from '@typescript-eslint/utils';

import {
  DSpaceESLintRuleInfo,
  NamedTests,
} from '../../util/structure';
import { getSourceCode } from '../../util/typescript';

export enum Message {
  NO_KEYDOWN_ON_BTN_DISABLED = 'noKeydownOnBtnDisabled',
}

export const info = {
  name: 'no-keydown-on-btn-disabled',
  meta: {
    docs: {
      description: `An element with \`dsBtnDisabled\` must not carry its own \`(keydown)\` handler.
      Angular chains a template listener onto the directive's host listener for the same event instead of adding a second DOM listener, so the \`stopImmediatePropagation()\` in \`BtnDisabledDirective\` never reaches it and the handler runs even while the element is disabled.
      Put the handler on a wrapper element, or read the disabled state inside the handler.
      Key pseudo-events such as \`(keydown.enter)\` register under their own event name, are not chained, and are stopped as expected.`,
    },
    type: 'problem',
    schema: [],
    messages: {
      [Message.NO_KEYDOWN_ON_BTN_DISABLED]: 'This `(keydown)` handler runs even while `dsBtnDisabled` is true. Move it to a wrapper element, or check the disabled state inside the handler.',
    },
  },
  optionDocs: [],
  defaultOptions: [],
} as DSpaceESLintRuleInfo;

export const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: info.meta,
  defaultOptions: info.defaultOptions,
  create(context: TSESLint.RuleContext<Message, unknown[]>) {
    const parserServices = getSourceCode(context).parserServices as TemplateParserServices;

    return {
      Element(node: TmplAstElement) {
        if (![...node.inputs, ...node.attributes].some((attribute) => attribute.name === 'dsBtnDisabled')) {
          return;
        }

        for (const output of node.outputs) {
          if (output.name === 'keydown') {
            context.report({
              messageId: Message.NO_KEYDOWN_ON_BTN_DISABLED,
              loc: parserServices.convertNodeSourceSpanToLoc(output.sourceSpan),
            });
          }
        }
      },
    };
  },
});

export const tests = {
  plugin: info.name,
  valid: [
    {
      name: 'a disabled button without its own keydown handler',
      code: `
<button [dsBtnDisabled]="isDisabled" (click)="submit()">Submit</button>
      `,
    },
    {
      name: 'a keydown handler on an element without dsBtnDisabled',
      code: `
<button (keydown)="onKeydown($event)">Submit</button>
      `,
    },
    {
      name: 'a keydown handler on a wrapper around the disabled button',
      code: `
<span (keydown)="onKeydown($event)"><button [dsBtnDisabled]="isDisabled">Submit</button></span>
      `,
    },
    {
      name: 'a key pseudo-event is not chained onto the host listener, so it is still stopped',
      code: `
<button [dsBtnDisabled]="isDisabled" (keydown.enter)="onEnter($event)">Submit</button>
      `,
    },
    {
      name: 'dsBtnDisabled named inside another attribute value',
      code: `
<button (keydown)="log('dsBtnDisabled')">Submit</button>
      `,
    },
    {
      name: 'a comparison operator in an attribute value does not end the tag',
      code: `
<button [dsBtnDisabled]="page <= 1" (click)="goPrev()">Previous</button>
      `,
    },
  ],
  invalid: [
    {
      name: 'a disabled button with its own keydown handler',
      code: `
<button [dsBtnDisabled]="isDisabled" (keydown)="onKeydown($event)">Submit</button>
      `,
      errors: [{ messageId: Message.NO_KEYDOWN_ON_BTN_DISABLED }],
    },
    {
      name: 'a disabled button with a comparison operator and a keydown handler',
      code: `
<button [dsBtnDisabled]="page <= 1" (keydown)="onKeydown($event)">Previous</button>
      `,
      errors: [{ messageId: Message.NO_KEYDOWN_ON_BTN_DISABLED }],
    },
    {
      name: 'a disabled element that is not a button',
      code: `
<a [dsBtnDisabled]="isDisabled" (keydown)="onKeydown($event)">Next</a>
      `,
      errors: [{ messageId: Message.NO_KEYDOWN_ON_BTN_DISABLED }],
    },
  ],
} as NamedTests;

export default rule;
