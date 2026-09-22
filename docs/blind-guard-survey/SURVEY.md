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

Every pass works on the same unit: **one `it()` plus the `beforeEach` bodies of the `describe`s
that enclose it**. An event delivered in a `beforeEach` belongs to every `it()` in that `describe`,
and a rule that only reads inside the `it()` cannot see it.

| Shape | How it is detected | Why it can pass over a broken state |
|---|---|---|
| **A** probe attached after creation | `X.addEventListener('e', () => flag = true)` on a fixture element anywhere in the unit, plus `expect(flag).toBeFalse()` in the `it()` | the probe is a second native listener; the application never has one |
| **B** `triggerEventHandler` standing in for a real DOM event | a unit that delivers its event only through `.triggerEventHandler(` and whose `it()` contains a negative assertion | it calls the recorded bindings directly, never enters the DOM event system, and is a silent no-op when the binding is absent |
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
python docs/blind-guard-survey/detect-wrong-object-guards.py src [out.json]
```

With an output path it writes one row per spec, so the names behind every count below can be
printed rather than re-derived.

### Parser defects found while calibrating, and fixed

Each of these changed a number, so they are listed rather than quietly corrected.

1. **Resolving "the unit under test" by sibling filename misses the founding instance.**
   `btn-disabled.directive.ts` is tested by `disabled-directive.spec.ts`. Units are resolved through
   the spec's relative imports instead.
2. **An apostrophe in a comment opened a string literal that never closed**, so one `it()` block
   absorbed the rest of the file and produced a false positive. Comments are blanked before the
   balanced-paren scan.
3. **Three passes, three different scopes.** Shape A, shape B and the suppression census each read
   a different slice, which hid every claim whose event is delivered in a `beforeEach`. They now
   share one unit, and the census grew by two blocks when they did.
4. **Attribute names were read from inside quoted values.** `class="btn btn-danger"` contributed
   `btn` and `btn-danger` as if they were attributes, which inflated shape C's "missing" lists by
   roughly two thirds. Values are blanked before the attribute scan.
5. **Compound selectors mis-split.** `[ngModel][dsDebounce]` became the unmatchable key
   `ngModel][dsDebounce`. A selector is now a *set* of required attributes and matches a tag that
   carries all of them.
6. **`it()` titles containing an escaped quote were truncated** at the backslash, so the reported
   name was not the spec's name. In a deliverable that *is* a list of names, that is a defect and
   not a cosmetic one.

## What the suite contains

954 `*.spec.ts` are tracked. 949 are the Karma suite (`tsconfig.spec.json` includes
`src/**/*.spec.ts`); the 5 under `lint/` run under plain Node through `npm run test:lint`, create
no component and dispatch no event, so no shape applies to them.

Of the 949: **14 carry at least one shape, 935 carry none.** A second, independent pass counts every
unit that delivers an event and then asserts something did **not** happen — the whole damage class —
and finds **19 blocks in 15 files**.

The two overlap, so the population actually read and judged by hand is their union: **24 spec
files, 22 `it()` blocks carrying a verdict** plus ten detector hits explained as not being guard
claims. **925 files were flagged by no pass at all.**

## The answer, including where it is a negative result

Shape A is a population of one file: the founding instance, and nothing else. Only two files in the
suite call `addEventListener` on a fixture element, and the second is the legitimate counterexample.

Shape B produced eleven candidates and **no confirmed finding attributable to `triggerEventHandler`
itself** — each candidate either goes red under mutation or is blind for a different reason. That
is a negative result, not a clean bill of health.

Shape C diverges in three specs and matters in one, the same founding instance, where the missing
`(click)` is exactly what coalesces.

The blind blocks the survey *added* come from a mechanism the shapes did not name and the mutation
runs found: asserting an absence that is also the state before the feature runs. **Six of those**,
and the sixth only surfaced after defect 3 above was fixed.

## Verdicts

Blind means: shown green while the thing it guards is gone or already broken.
Fine means: shown red when the thing it guards is removed.
Undecided means neither could be shown, and the reason is given.

### Blind

| spec : it() | shape | how it was shown |
|---|---|---|
| `shared/disabled-directive.spec.ts` : `should prevent click events when disabled` | A + C | at an untouched HEAD a host mirroring the product (`(click)` and `[dsBtnDisabled]` on the same tag) has its handler called, while this spec is green |
| `shared/disabled-directive.spec.ts` : `should prevent Enter or Space keydown events when disabled` | A + C | the guard has two halves and only `preventDefault()` does anything in the product. Neutralise **only** `preventDefault()`, leaving `stopImmediatePropagation()`: the spec stays green and nothing else in the suite goes red |
| `process-page/detail/process-detail.component.spec.ts` : `should not display the process's output logs` | B + absence assertion | the `@if` that renders the `<pre>` neutralised: the counterpart `should display the process's output logs` goes red, this one stays green |
| `process-page/…/date-value-input.component.spec.ts` : `should not show a validation error if the input field was touched but not left empty` | B + absence assertion | the whole `@if` that renders `.validation-error` neutralised: the sibling `should show a validation error…` goes red, this one stays green |
| `process-page/…/integer-value-input.component.spec.ts` : same title | B + absence assertion | same run |
| `process-page/…/string-value-input.component.spec.ts` : same title | B + absence assertion | same run |
| `process-page/form/scripts-select/scripts-select.component.spec.ts` : same title | B + absence assertion | same run |
| `shared/utils/markdown.directive.spec.ts` : `should not convert words with dots (e.g. demandés.es) to links …` | absence assertion | `render()` made to produce nothing: both sanitisation specs go red, this one stays green |

Six of the eight are a second mechanism the survey turned up: the assertion is that an element or a
substring is **absent**, which is also the state before the feature runs at all. Each is covered in
practice by a positive sibling in the same file, which is why the suite still notices the breakage —
but the block itself guards nothing.

Those six are listed under shape B where that is what flagged them. The blindness actually
*demonstrated* for them is the absence assertion: neutralising the whole `@if` does not isolate
`triggerEventHandler` as a cause, and claiming it did would overstate the control.

The keydown row is a case that was filed as undecided in the first pass and should not have been.
The reasoning that it will only *matter* once some template puts a `(keydown)` next to a
`dsBtnDisabled` (0 of 175 do today) is still right and still worth acting on — but it does not make
the spec undecidable, because the half of the guard that does work in the product can be removed on
its own, and the spec does not notice.

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

Fourteen blocks, each shown red by its own mutation.

Detector hits that are not guard claims at all, and why: `eperson-form.component.spec.ts` (two
blocks) and `file-section.component.spec.ts` assert `toHaveBeenCalled` and carry an incidental
`toBeFalse()` on a CSS class or a page flag; `item-page-cc-license-field.component.spec.ts` uses
its listener to await an image; `context-help-wrapper.component.spec.ts` : `should display the
tooltip` is a positive claim with four `toHaveBeenCalled` assertions and one incidental
`toHaveBeenCalledTimes(0)`; `collections.component.spec.ts` : `should display the owning collection
and three mapped collections` asserts eleven positive things about the loaded state and one
incidental `expect(loadMoreBtn).toBeNull()`. `browse-by-page`, `comcol-browse-by` and
`context-help.directive` declare inline hosts whose shape matches every real usage
(`<ng-template dsDynamicComponentLoader>` in 4 product templates, `*dsContextHelp` in 6).

### Undecided

No `it()` block is left undecided. What remains undecided is population-level, and it is real.

| what | why it cannot be decided here |
|---|---|
| the 925 specs that no pass flagged | the detector finding nothing is a statement about the three shapes plus the suppression census, not a proof that those specs are detectors for what they claim. That would take 925 mutations. Calling them fine would be the tidy answer, not the measured one. **This bucket is not inert:** it is the complement of the flagged set, and the detector already writes one row per spec, so the 925 names can be printed from the JSON output at any time — they are unlisted, not unknown |
| directives exercised only inside component specs | `authority-confidence-state`, `hover-outside`, `sections`, `file-value-accessor`, `require-file`, `click-outside`, `debounce`, `role`, `tabulatable-objects` have no dedicated host, so shape C was never evaluated for them |
| shape C's threshold | `max(1, n // 2)` is calibrated only against `dsBtnDisabled` (n = 175). For n of 1 or 3 it is arithmetic noise, and those cases were decided by mutation instead. A selector used twice, where one usage is load-bearing, would be missed; there is no such case in this repository, which is not the same as there being none |

## Also found, not part of this class

Eight of the 27 `@Directive` files have no spec that imports them at all: `ngForTrackById`,
`dsAutoFocus`, `dsRenderOnlyForBrowser`, `dsDragClick`, `dsInListValidator`,
`dsMetadataFieldValidator`, the selector-less `statistics-page.directive`, and the
`ngComponentOutlet` test stub — seven of the 25 attribute selectors, plus one abstract directive.
That is a missing guard rather than a blind one.
