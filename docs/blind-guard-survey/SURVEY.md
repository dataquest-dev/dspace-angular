# Guards that pass over a shape the application never builds

A spec is only a guard if it changes colour when the thing it guards breaks. This is a survey of
the Karma suite for specs that do not: they assert over an object the spec itself built, which
differs from the object the running application builds in exactly the property being claimed.

Nothing is fixed here. Each fix is its own change.

## Blind or fine is a property of the pair, not of the spec

Read this before the tables, because the first version of this document got it wrong.

A verdict is about a **(spec, mutation) pair**. Break the thing the spec names and watch: if it
goes red it is a detector, if it stays green it is blind. Break something else and the answer is
about the something else.

The trap is that a negative assertion — "this element is not there", "this was not called" —
stays green for two completely different reasons. Either the production code correctly suppressed
the thing, or the thing could never have happened in the first place. Delete the feature and every
negative assertion in the suite turns green. That proves nothing about any of them.

So each mutation here targets the **condition the block names in its own title**, not the feature
the block happens to sit next to. Five blocks in this document were called blind by the other kind
of mutation and are not blind; they are in the Fine table with the weakness they do have written
next to them, and the class is counted in Undecided.

## Why the class exists

`BtnDisabledDirective` carries `should prevent click events when disabled`, and that spec is
green. A real click on a disabled `dsBtnDisabled` element nevertheless reaches the component's
`(click)` handler.

The spec passes because it registers its probe with `addEventListener` **after** the component
exists. That is a second, independent native listener, and `stopImmediatePropagation()` does stop
it. In the product the handler is a `(click)` in the same template, and Angular coalesces it onto
the directive's own listener (`__ngNextListenerFn__`) rather than adding a second one, so there is
nothing left for `stopImmediatePropagation()` to stop **on that element**. The spec measures a
different object than the application builds.

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

With an output path it writes one row per spec — **every** spec, flagged or not, with no flag
field. To get the names behind a count, apply the same predicate the tool prints:

```bash
python -c "import json,sys; rows=json.load(open(sys.argv[1])); \
print('\n'.join(r['spec'] for r in rows if not (r['A'] or r['A_other'] or r['B'] or r['C'] or r['claims'])))" out.json
```

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
6. **`it()` titles containing an escaped quote were wrong twice.** First truncated at the
   backslash, then printed with the backslash still in (`the process\'s output logs`). The tool now
   unescapes, so a printed name is the spec's name.

### Known limits of the parser, none of which fires on this tree

Recorded so the next person knows what breaks it, not chased.

- `it(` and `describe(` are matched inside string and template literals, so an inline `template:`
  containing the text `it('…')` would grow a phantom unit.
- A regex literal containing a quote desynchronises `strip_comments` — the same failure mode as
  defect 2 above.
- `ATTR_VALUE` blanks only *quoted* attribute values; an unquoted `type=text` would still leak
  `text` in as an attribute name.
- `INLINE_TEMPLATE` matches any `template:` backtick, not only one inside `@Component`.
- Shape B's "only delivery is `triggerEventHandler`" means "no `dispatchEvent`, `.click()` or
  `new XEvent` in the unit". A unit delivering by `.focus()` or by calling the method directly
  still counts.

## What the suite contains

954 `*.spec.ts` are tracked. 949 are the Karma suite (`tsconfig.spec.json` includes
`src/**/*.spec.ts`); the 5 under `lint/` run under plain Node through `npm run test:lint`, create
no component and dispatch no event, so no shape applies to them.

Of the 949: **14 carry at least one shape, 935 carry none.** A second pass counts every unit that
delivers an event and then asserts something did **not** happen: **19 blocks in 15 files**. That
pass is *not* the whole damage class — see the bound below.

Together the two flag **24 distinct `it()` blocks**, plus 6 files flagged at file level by shape C
and 1 by the legitimate `addEventListener` use. Those blocks live in **24 spec files**, which is
the population read and judged by hand. **925 files were flagged by no pass at all.**

Of the 24 flagged blocks: 18 carry a verdict below, and 6 are dismissed with a reason. Four more
verdict rows come from shape-C file hits and from mutation runs rather than from a flagged block,
which is why the verdict tables hold 22 blocks and not 18.

## The answer, including where it is a negative result

Shape A is a population of one file: the founding instance, and nothing else. Only two files in the
suite call `addEventListener` on a fixture element, and the second is the legitimate counterexample.
That one file carries two blind blocks.

Shape B produced eleven candidate files and **no confirmed finding attributable to
`triggerEventHandler` itself** — every candidate goes red under a condition-targeted mutation.
That is a negative result, not a clean bill of health.

Shape C diverges in three specs and matters in one, the same founding instance, where the missing
`(click)` is exactly what coalesces.

**Three blind blocks in 949 specs.** The founding instance's two, and one in
`markdown.directive.spec.ts` that nothing in the survey's own passes found.

## Verdicts

Blind means: green while the condition the block names is broken.
Fine means: red when the condition the block names is broken.
Undecided means neither could be shown, and the reason is given.

### Blind

| spec : it() | shape | how it was shown |
|---|---|---|
| `src/app/shared/disabled-directive.spec.ts` : `should prevent click events when disabled` | A + C | at an untouched HEAD, a host mirroring the product (`(click)` and `[dsBtnDisabled]` on the same tag) has its handler called, while this spec is green |
| `src/app/shared/disabled-directive.spec.ts` : `should prevent Enter or Space keydown events when disabled` | A + C | the guard has two halves and only `preventDefault()` acts on the same element. Neutralise **only** `preventDefault()`, leaving `stopImmediatePropagation()`: the spec stays green and the suite reports `TOTAL: 6130 SUCCESS`, 0 failures |
| `src/app/shared/utils/markdown.directive.spec.ts` : `should not convert words with dots (e.g. demandés.es) to links …` | none — found by mutation, not by a pass | `fuzzyLink: true` provably turns that exact string into `<a href="http://xn--demands-gya.es">`, checked against the repo's own markdown-it. Flip that one production setting, which is what the block's title is about, and the spec stays green |

The third row is the useful one for anyone repeating this work: it was found by flipping a setting,
not by any of the three shapes. No pass in this detector would have caught it.

### Fine

Nineteen blocks. Each goes red when the condition it names is removed.

| spec : it() | shown by |
|---|---|
| `clarin-licenses/…/clarin-license-table.component.spec.ts` : `should not call delete when clicking disabled delete button` | red once **both** guards are neutralised — the `&&` short-circuit in the `(click)` and the early return in `deleteLicense()`. Neutralising only the template one leaves it green: the template guard is redundant |
| `clarin-licenses/…/clarin-license-table.component.spec.ts` : `should not open confirmation modal when clicking disabled delete on linked label` | red when the `(click)` short-circuit is neutralised; `confirmDeleteLabel()` has no second guard |
| `access-control/epeople-registry/epeople-registry.component.spec.ts` : `should not open delete modal before authenticated user id is resolved` | red when the `currentAuthenticatedUserId` early return in `deleteEPerson()` is neutralised |
| `admin/admin-sidebar/admin-sidebar.component.spec.ts` : `should call expandPreview on the menuService after 100ms` | red when `handleMouseEnter` no longer calls `expandPreview` |
| `admin/admin-sidebar/admin-sidebar.component.spec.ts` : `should call collapseMenuPreview on the menuService after 400ms` | red when `handleMouseLeave` no longer calls `collapsePreview` |
| `navbar/expandable-navbar-section/…component.spec.ts` : `should not call activateSection on the menuService` | red when the `!isMobile` guard in `onMouseEnter` is neutralised |
| `navbar/expandable-navbar-section/…component.spec.ts` : `should not call deactivateSection on the menuService` | red when the same guard in `onMouseLeave` is neutralised |
| `thumbnail/thumbnail.component.spec.ts` : `should set isLoading$ to false once an image is successfully loaded` | red when `successHandler()` no longer clears the flag |
| `shared/hover-class.directive.spec.ts` : `should add the class on mouseenter and remove on mouseleave` | red when `onMouseEnter` no longer adds the class; the shape-C divergence is real but the directive suppresses nothing, so it is not load-bearing |
| `shared/utils/markdown.directive.spec.ts` : both `should sanitize the script element out of innerHTML` | red when `render()` produces nothing |
| `access-control/group-registry/group-form/group-form.component.spec.ts` : `should not call GroupDataService.delete` | red when the `if (confirm)` around the delete is neutralised |
| `item-page/versions/…/item-versions-row-element-version.component.spec.ts` : `should not call ItemService.delete` | red when the `if (ok)` around the delete is neutralised |
| `shared/comcol/comcol-forms/comcol-form/comcol-form.component.spec.ts` : `should not call handleLogoDeletion and dsoService.deleteLogo methods when deletion is refused` | red when the `if (confirmed)` in `subscribeToConfirmationResponse` is neutralised |
| `process-page/…/date-value-input.component.spec.ts` : `should not show a validation error if the input field was touched but not left empty` | red when the `invalid` term in the `@if` is neutralised so the error renders whatever the value is. **Carries the end-state-only weakness below** |
| `process-page/…/integer-value-input.component.spec.ts` : same title | same run, same weakness |
| `process-page/…/string-value-input.component.spec.ts` : same title | same run, same weakness |
| `process-page/form/scripts-select/scripts-select.component.spec.ts` : same title | same run, same weakness |
| `process-page/detail/process-detail.component.spec.ts` : `should not display the process's output logs` | red when the `@if` condition is forced true so the `<pre>` renders whatever the state is. **Carries the end-state-only weakness below** |

That single run was `TOTAL: 5 FAILED, 6125 SUCCESS`, with every sibling correctly staying green:
the `left untouched but left empty` blocks never satisfy `dirty || touched`, and
`should show a validation error if the input field was touched but left empty` and
`should display the process's output logs` all stayed green.

#### The weakness those last five do have

They read only the **end state**. `expect(validationError).toBeFalsy()` is satisfied by "the code
correctly suppressed the error" and by "nothing could have rendered it" alike, and the block cannot
tell the two apart. Remove the `@if` entirely and all five stay green.

That is worth knowing and worth fixing — assert the transition, not the end state — but it is not
blindness. The first version of this document called it blindness, on the strength of exactly that
feature-removal mutation. The class is bounded in Undecided below, because it is much larger than
the part this survey looked at.

### Not guard claims, and why

| spec : it() | why |
|---|---|
| `access-control/…/eperson-form.component.spec.ts` : `should call the epersonService delete when clicked on the button` | the claim is `toHaveBeenCalledWith`; the `toBeFalse()` the detector saw is `classList.contains('disabled')`, a precondition |
| `access-control/…/eperson-form.component.spec.ts` : `should still open the delete modal when a submitter probe errors (centralised catchError)` | claim is `toHaveBeenCalled`; the `toBeUndefined()` is on a modal input, `warningLabel` |
| `access-control/…/epeople-registry.component.spec.ts` : `should still open the delete modal when a submitter probe errors (centralised catchError)` | same shape as the row above — a positive `toHaveBeenCalled` claim plus an end-state `toBeUndefined()` on `warningLabel`, which is also its value before anything sets it. The positive half is a real detector; the second half is end-state-only |
| `item-page/…/file-section.component.spec.ts` : `clicking on the view less link should reset the pages and call getNextPage()` | claim is `toHaveBeenCalled` plus `currentPage === 1`; the `toBeFalse()` is on `isLastPage` |
| `item-page/…/item-page-cc-license-field.component.spec.ts` | `addEventListener('load'/'error')` resolves a promise that *waits* for the image; nothing is asserted about the listener |
| `shared/context-help-wrapper/context-help-wrapper.component.spec.ts` : `should display the tooltip` | four assertions in total: two of the `toHaveBeenCalled` family, one `toHaveBeenCalledTimes(0)` on `tooltip.close`, one `textContent` check. A positive claim |
| `item-page/field-components/collections/collections.component.spec.ts` : `should display the owning collection and three mapped collections` | 13 `expect()` calls — 12 about the loaded state plus one incidental `expect(loadMoreBtn).toBeNull()`. Two of the 12 are themselves `toBe(false)` on `hasMore$` and `isLoading$`, which is what the detector matched |
| `browse-by-page`, `comcol-browse-by`, `context-help.directive` | inline hosts whose shape matches every real usage (`<ng-template dsDynamicComponentLoader>` in 4 product templates, `*dsContextHelp` in 6) |

### Undecided

No `it()` block that was measured is left undecided. What remains undecided is population-level.

| what | why it cannot be decided here |
|---|---|
| **the end-state-only class: 118 blocks in 70 files** | the detector counts them: `blocks asserting an absent queried element : 118 in 70 files`, of which **6** have an event in the unit and are the ones this survey adjudicated, and **112 have no event at all and were never read**. Five of the 112 sit in files already open here — the `should not show a validation error if the input field was left untouched but left empty` block one line above each of the four parameter inputs, plus a fifth file, `file-value-input.component.spec.ts:50`, that does no setup whatsoever and asserts the pre-state in the strongest form there is. This class has no detector pass. It has a bound and nothing else |
| the 925 specs that no pass flagged | the detector finding nothing is a statement about the measured shapes, not a proof that those specs are detectors for what they claim. That would take 925 mutations. **The bucket is not inert:** it is the exact complement of the judged set and the command above prints the names — they are unlisted, not unknown |
| directives exercised only inside component specs | `ngVar` first, because it is the largest: no sibling spec at all, imported by dozens of component specs, and used in **91 product templates**, more than any other directive in the repo except the `routerLink` test double. Then `dsAuthorityConfidenceState`, `dsHoverOutside`, `dsSection`, `input[type=file]` (`FileValueAccessorDirective`), `requireFile`, `dsClickOutside`, `dsDebounce`, `dsShowOnlyForRole`/`dsShowExceptForRole`, `dsTabulatableObjects`. `ipV4format` is a milder case: it has a dedicated spec but no inline host, so shape C was never evaluated for it either. `routerLink` and `queryParams` are test doubles under `src/app/shared/testing/`, not product directives |
| shape C's threshold | `max(1, n // 2)` is calibrated only against `dsBtnDisabled` (n = 175). For n of 1 or 3 it is arithmetic noise, and those cases were decided by mutation instead. A selector used twice, where one usage is load-bearing, would be missed; there is no such case here, which is not the same as there being none |
| whether `stopImmediatePropagation()` does anything in the product | the keydown verdict rests on `preventDefault()` being the half that acts **on the same element**. `stopImmediatePropagation()` also stops the event reaching handlers on *ancestors*, and no usage of the 175 was checked for an ancestor handler. The verdict does not depend on it, but the other half was not measured |

## Also found, not part of this class

Eight of the 27 `@Directive` files have no spec that imports them at all: `ngForTrackById`,
`dsAutoFocus`, `dsRenderOnlyForBrowser`, `dsDragClick`, `dsInListValidator`,
`dsMetadataFieldValidator`, the selector-less `statistics-page.directive`, and the
`ngComponentOutlet` test stub — seven of the 25 attribute selectors, plus one abstract directive.
That is a missing guard rather than a blind one.

`markdown.directive.spec.ts` assigns `environment.markdown.enabled` in three `describe` bodies
(lines 57, 81, 105). Those run at load time, before any spec does, so all three describes run with
whatever the last assignment left and the one labelled "markdown disabled" is not running with
markdown disabled.
