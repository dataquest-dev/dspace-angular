# Guards that pass over a shape the application never builds

A spec is only a guard if it changes colour when the thing it guards breaks. This is a survey of
the Karma suite for specs that do not: they assert over an object the spec itself built, which
differs from the object the running application builds in exactly the property being claimed.

Nothing is fixed here. Each fix is its own change.

## Why the class exists

`BtnDisabledDirective` carries `should prevent click events when disabled`, and that spec is
green. A real click on a disabled `dsBtnDisabled` element nevertheless reaches the component's
`(click)` handler.

The spec passes because it registers its probe with `addEventListener` **after** the component
exists. That is a second, independent native listener, and `stopImmediatePropagation()` does stop
it. In the product the handler is a `(click)` in the same template, and Angular coalesces it onto
the directive's own listener (`__ngNextListenerFn__`) rather than adding a second one, so there is
nothing left for `stopImmediatePropagation()` to stop. The spec measures a different object than
the application builds.

## The detectable shape

| Shape | How it is detected | Why it can pass over a broken state |
|---|---|---|
| **A** probe attached after creation | `X.addEventListener('e', () => flag = true)` on a fixture element inside an `it()`, plus `expect(flag).toBeFalse()` in the same block | the probe is a second native listener; the application never has one |
| **B** `triggerEventHandler` standing in for a real DOM event | an `it()` that delivers its event only through `.triggerEventHandler(` and contains a negative assertion | it calls the recorded bindings directly, never enters the DOM event system, and is a silent no-op when the binding is absent |
| **C** host template diverging from the product | an inline `@Component({ template })` whose tag carries a repo directive selector and omits an attribute that co-occurs with that selector in at least `max(1, n // 2)` of its `n` real usages in `src/**/*.html` | the directive is measured in a shape no product template uses |

The `max(1, n // 2)` threshold is meaningful where `n` is large (`dsBtnDisabled`, 175 usages,
threshold 87) and is arithmetic noise where `n` is 1 or 3. Selectors in that range were decided by
mutation instead, never by the threshold.

The same APIs used legitimately fail one of the clauses. `item-page-cc-license-field.component.spec.ts`
adds `load`/`error` listeners to *wait* for an image and then asserts on component state — nothing
is asserted about the listener, so shape A does not apply. Roughly sixty specs call
`triggerEventHandler` to invoke a handler and assert it ran; shape B needs the negative assertion.

Run the detector with:

```bash
python docs/blind-guard-survey/detect-wrong-object-guards.py src
```

## What the suite contains

954 `*.spec.ts` are tracked. 949 are the Karma suite (`tsconfig.spec.json` includes
`src/**/*.spec.ts`); the 5 under `lint/` run under plain Node through `npm run test:lint`, create
no component and dispatch no event, so no shape applies to them.

Of the 949: 12 carry at least one shape, 937 carry none. A second, independent pass counts every
`it()` that delivers an event and then asserts something did **not** happen — the whole damage
class. It runs at two scopes, because a claim whose event is delivered in the enclosing
`describe`'s `beforeEach` is invisible to a block-scoped rule: 11 blocks at `it()` scope, 6 more at
`describe` scope, **17 blocks in 13 files** once the overlap is removed. Every one is listed below.

## The answer, including where it is a negative result

Shape A is a population of one: the founding instance, and nothing else. Two files in the suite
call `addEventListener` on a fixture element, and the second is the legitimate counterexample.

Shape B produced nine candidates and **no confirmed finding attributable to `triggerEventHandler`
itself** — each candidate either goes red under mutation or is blind for a different reason. That
is a negative result, not a clean bill of health.

Shape C diverges in six specs and matters in one, the same founding instance, where the missing
`(click)` is exactly what coalesces.

The blind blocks the survey *added* come from a mechanism the shapes did not name and the mutation
runs found: asserting an absence that is also the state before the feature runs. Five of those.

## Verdicts

Blind means: shown green while the thing it guards is gone or already broken.
Fine means: shown red when the thing it guards is removed.
Undecided means neither could be shown, and the reason is given.

### Blind

| spec : it() | shape | how it was shown |
|---|---|---|
| `shared/disabled-directive.spec.ts` : `should prevent click events when disabled` | A + C | at an untouched HEAD a host mirroring the product (`(click)` and `[dsBtnDisabled]` on the same tag) has its handler called, while this spec is green |
| `process-page/…/date-value-input.component.spec.ts` : `should not show a validation error if the input field was touched but not left empty` | B | the whole `@if` that renders `.validation-error` neutralised: the sibling `should show a validation error…` goes red, this one stays green |
| `process-page/…/integer-value-input.component.spec.ts` : same title | B | same run |
| `process-page/…/string-value-input.component.spec.ts` : same title | B | same run |
| `process-page/form/scripts-select/scripts-select.component.spec.ts` : same title | B | same run |
| `shared/utils/markdown.directive.spec.ts` : `should not convert words with dots (e.g. demandés.es) to links …` | absence assertion | `render()` made to produce nothing: both sanitisation specs go red, this one stays green |

The last five are a second mechanism the survey turned up: the assertion is that an element or a
substring is **absent**, which is also the state before the feature runs at all. They are covered
in practice by a positive sibling in the same file, which is why the suite still notices the
breakage — but the block itself guards nothing.

The four value-input blocks are listed under shape B because that is what flagged them. The
blindness actually *demonstrated* for them is the absence assertion: neutralising the whole `@if`
does not isolate `triggerEventHandler` as a cause, and claiming it did would overstate the control.

### Fine

| spec : it() | shown by |
|---|---|
| `clarin-licenses/…/clarin-license-table.component.spec.ts` : `should not call delete when clicking disabled delete button` | red once **both** guards are neutralised — the `&&` short-circuit in the `(click)` and the early return in `deleteLicense()`. Neutralising only the template one leaves it green: the template guard is redundant |
| `clarin-licenses/…/clarin-license-table.component.spec.ts` : `should not open confirmation modal when clicking disabled delete on linked label` | red when the `(click)` short-circuit is neutralised; `confirmDeleteLabel()` has no second guard |
| `access-control/epeople-registry/epeople-registry.component.spec.ts` : `should not open delete modal before authenticated user id is resolved` | red when the `currentAuthenticatedUserId` early return in `deleteEPerson()` is neutralised |
| `admin/admin-sidebar/admin-sidebar.component.spec.ts` : `should call expandPreview on the menuService after 100ms` | red when `handleMouseEnter` no longer calls `expandPreview` |
| `admin/admin-sidebar/admin-sidebar.component.spec.ts` : `should call collapseMenuPreview on the menuService after 400ms` | red when `handleMouseLeave` no longer calls `collapsePreview` |
| `navbar/expandable-navbar-section/…spec.ts` : `should not call activateSection on the menuService` | red when the `!isMobile` guard in `onMouseEnter` is neutralised |
| `navbar/expandable-navbar-section/…spec.ts` : `should not call deactivateSection on the menuService` | red when the same guard in `onMouseLeave` is neutralised |
| `thumbnail/thumbnail.component.spec.ts` : `should set isLoading$ to false once an image is successfully loaded` | red when `successHandler()` no longer clears the flag |
| `shared/hover-class.directive.spec.ts` : `should add the class on mouseenter and remove on mouseleave` | red when `onMouseEnter` no longer adds the class; the shape-C divergence is real but the directive suppresses nothing, so it is not load-bearing |
| `shared/utils/markdown.directive.spec.ts` : both `should sanitize the script element out of innerHTML` | red when `render()` produces nothing |
| `access-control/group-registry/group-form/group-form.component.spec.ts` : `should not call GroupDataService.delete` | red when the `if (confirm)` around the delete is neutralised |
| `item-page/versions/…/item-versions-row-element-version.component.spec.ts` : `should not call ItemService.delete` | red when the `if (ok)` around the delete is neutralised |
| `shared/comcol/comcol-forms/comcol-form/comcol-form.component.spec.ts` : `should not call handleLogoDeletion and dsoService.deleteLogo methods when deletion is refused` | red when the `if (confirmed)` in `subscribeToConfirmationResponse` is neutralised |

Detector hits that are not guard claims at all, and why: `eperson-form.component.spec.ts` (two
blocks) and `file-section.component.spec.ts` assert `toHaveBeenCalled` and carry an incidental
`toBeFalse()` on a CSS class or a page flag; `item-page-cc-license-field.component.spec.ts` uses
its listener to await an image; `context-help-wrapper.component.spec.ts` : `should display the
tooltip` is a positive claim with four `toHaveBeenCalled` assertions and one incidental
`toHaveBeenCalledTimes(0)`. `browse-by-page`, `comcol-browse-by` and `context-help.directive`
declare inline hosts whose shape matches every real usage (`<ng-template dsDynamicComponentLoader>`
in 4 product templates, `*dsContextHelp` in 6).

### Undecided

| spec : it() | why it cannot be decided |
|---|---|
| `shared/disabled-directive.spec.ts` : `should prevent Enter or Space keydown events when disabled` | it carries shape A and shape C, and it does go red when the directive's keydown listener is removed — so it is not vacuous. But the property it names is currently **true** in the product: no tag carrying `dsBtnDisabled` has a same-tag `(keydown)` (0 of 175), so there is nothing for Angular to coalesce and nothing to break. Showing it green over a broken state would require inventing a template the product does not have. It becomes blind the day anyone adds a `(keydown)` next to a `dsBtnDisabled` |
| the 937 specs carrying no shape | the detector finding nothing is a statement about the three shapes, not a proof that those specs are detectors. Calling them fine would be the tidy answer, not the measured one |
| directives exercised only inside component specs | `authority-confidence-state`, `hover-outside`, `sections`, `file-value-accessor`, `require-file`, `click-outside`, `debounce`, `role`, `tabulatable-objects` have no dedicated host, so shape C was never evaluated for them |

## Also found, not part of this class

Eight of the 27 `@Directive` files have no spec that imports them at all: `ngForTrackById`,
`dsAutoFocus`, `dsRenderOnlyForBrowser`, `dsDragClick`, `dsInListValidator`,
`dsMetadataFieldValidator`, the selector-less `statistics-page.directive`, and the
`ngComponentOutlet` test stub — seven of the 25 attribute selectors, plus one abstract directive.
That is a missing guard rather than a blind one.
