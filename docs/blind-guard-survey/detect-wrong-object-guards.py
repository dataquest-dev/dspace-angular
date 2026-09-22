#!/usr/bin/env python3
"""
Survey the Karma spec suite for guards that assert over an object the running
application never builds.

Three shapes are measured; a spec can carry more than one.

  A  a DOM probe attached with addEventListener to a fixture element AFTER the
     component exists, whose non-firing is the proof that production code
     suppressed an event.  Angular coalesces template (event) bindings onto one
     native listener, so a listener added afterwards is a second native listener
     -- the only kind stopImmediatePropagation() can reach.

  B  an it() whose only event delivery is triggerEventHandler() and whose claim
     is a negative assertion.  triggerEventHandler invokes the bindings recorded
     on the DebugElement directly; it never enters the DOM event system, and it
     is a no-op when the binding is absent.

  C  an inline test-host template that applies a directive under test in a shape
     no real template in src/ uses.

Every pass runs over the same unit: an it() plus the beforeEach bodies of the
describes that enclose it.  An earlier version scoped shape A, shape B and the
suppression census differently, which hid claims whose event is delivered in a
beforeEach; see SURVEY.md.

The detector reports candidates.  A candidate is only called blind after a
negative control; the script does not decide that.

usage:  python detect-wrong-object-guards.py <src-root> [out.json]
"""
import json
import os
import re
import sys

IT_START = re.compile(r"\b(?:it|fit|xit)\s*\(\s*(['\"`])((?:\\.|(?!\1).)*)\1", re.S)
DESCRIBE_START = re.compile(r"\bdescribe\s*\(\s*(['\"`])((?:\\.|(?!\1).)*)\1", re.S)
BEFORE_EACH = re.compile(r"\bbeforeEach\s*\(")
IMPORT = re.compile(r"from\s+'(\.[^']*)'")
MECHCALL = re.compile(r"\b(preventDefault|stopPropagation|stopImmediatePropagation)\s*\(")
PROBE = re.compile(
    r"([\w.]+)\.addEventListener\s*\(\s*['\"`](\w+)['\"`]\s*,\s*"
    r"(?:\([^)]*\)|\w+)\s*=>\s*([A-Za-z_$][\w$]*)\s*=\s*true")
ANY_ADD = re.compile(r"([\w.]+)\.addEventListener\s*\(")
FIXTURE_RECV = re.compile(r"nativeElement|debugElement|fixture")
TRIGGER = re.compile(r"\.triggerEventHandler\s*\(")
REAL_EVENT = re.compile(r"\.dispatchEvent\s*\(|\.click\s*\(\s*\)|"
                        r"new\s+(?:Mouse|Keyboard|Pointer|Focus|Drag)Event")
NEG_ASSERT = re.compile(r"\.not\s*\.\s*toHaveBeenCalled|\.toBeFalse\s*\(|"
                        r"\.toBeFalsy\s*\(|\.toBe\s*\(\s*false\s*\)|"
                        r"\.toHaveBeenCalledTimes\s*\(\s*0\s*\)|\.toBeNull\s*\(|"
                        r"\.toBeUndefined\s*\(")
NOT_CALLED = re.compile(r"\.not\s*\.\s*toHaveBeenCalled|\.toHaveBeenCalledTimes\s*\(\s*0\s*\)")
DELIVERIES = (("native .click()", re.compile(r"\.click\s*\(\s*\)")),
              ("dispatchEvent", re.compile(r"\.dispatchEvent\s*\(")),
              ("triggerEventHandler", re.compile(r"\.triggerEventHandler\s*\(")),
              ("addEventListener probe", re.compile(r"\.addEventListener\s*\(")))
INLINE_TEMPLATE = re.compile(r"template\s*:\s*`(.*?)`", re.S)
TAG = re.compile(r"<([A-Za-z][\w-]*)((?:[^<>'\"]|'[^']*'|\"[^\"]*\")*?)/?>", re.S)
ATTR_VALUE = re.compile(r"=\s*('[^']*'|\"[^\"]*\")")
ATTR_NAME = re.compile(r"(\[\([\w.$-]+\)\]|\[[\w.$-]+\]|\([\w.$-]+\)|[*#]?[\w.$-]+)\s*(?==|\s|$)")
DIR_SELECTOR = re.compile(r"@Directive\s*\(\s*\{(.*?)\}\s*\)", re.S)
SELECTOR_FIELD = re.compile(r"selector\s*:\s*['\"`]([^'\"`]+)['\"`]")
BRACKETED = re.compile(r"\[([^\[\]]+)\]")


def strip_comments(text):
    """Blank out // and /* */ comments, keeping offsets, so an apostrophe in a
    comment ("the component's input") cannot open a fake string literal."""
    out, i, n = list(text), 0, len(text)
    while i < n:
        c = text[i]
        if c in "'\"`":
            q, i = c, i + 1
            while i < n:
                if text[i] == "\\":
                    i += 2
                    continue
                if text[i] == q:
                    break
                i += 1
            i += 1
        elif c == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                out[i] = " "
                i += 1
        elif c == "/" and i + 1 < n and text[i + 1] == "*":
            while i < n and not (text[i] == "*" and i + 1 < n and text[i + 1] == "/"):
                out[i] = " " if text[i] != "\n" else "\n"
                i += 1
            out[i] = out[i + 1] = " "
            i += 2
        else:
            i += 1
    return "".join(out)


def unescape(title):
    """A title is printed as the spec spells it: it('…the process\\'s output logs') is
    `the process's output logs`, not `the process\\'s output logs`. The list of names is
    the deliverable, so a name that is not the spec's name is a defect."""
    return re.sub(r"\\(['\"`\\])", r"\1", title)


def balanced_span(text, start):
    """text[start] begins a call; return (start, end) of the whole call."""
    i = text.index("(", start)
    depth, j, in_s, esc = 0, i, None, False
    while j < len(text):
        c = text[j]
        if in_s:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == in_s:
                in_s = None
        elif c in "'\"`":
            in_s = c
        elif c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return start, j + 1
        j += 1
    return start, len(text)


def balanced_block(text, start):
    a, b = balanced_span(text, start)
    return text[a:b]


def units(text):
    """Yield one record per it(): its title, its own body, and the concatenated
    bodies of the beforeEach calls of every describe that encloses it.

    The setup is what makes the three passes agree: an event delivered in a
    describe's beforeEach belongs to every it() inside that describe."""
    clean = strip_comments(text)
    describes = [balanced_span(clean, m.start()) for m in DESCRIBE_START.finditer(clean)]

    def direct_before_each(a, b):
        """beforeEach bodies inside [a,b) that are not inside a nested describe."""
        nested = [(x, y) for (x, y) in describes if a < x and y <= b]
        out = []
        for m in BEFORE_EACH.finditer(clean, a, b):
            if any(x <= m.start() < y for (x, y) in nested):
                continue
            out.append(balanced_block(clean, m.start()))
        return out

    setups = {(a, b): direct_before_each(a, b) for (a, b) in describes}
    top = direct_before_each(0, len(clean))

    for m in IT_START.finditer(clean):
        a, b = balanced_span(clean, m.start())
        enclosing = [(x, y) for (x, y) in describes if x <= a and b <= y]
        setup = list(top)
        for span in sorted(enclosing, key=lambda s: s[0]):
            setup.extend(setups[span])
        yield {"it": unescape(m.group(2)), "body": clean[a:b], "setup": "\n".join(setup)}


def read(path):
    return open(path, encoding="utf-8", errors="replace").read()


def units_under_test(spec, text):
    base, srcs = os.path.dirname(spec), set()
    sibling = spec[:-len(".spec.ts")] + ".ts"
    if os.path.exists(sibling):
        srcs.add(sibling.replace("\\", "/"))
    for rel in IMPORT.findall(text):
        p = os.path.normpath(os.path.join(base, rel)).replace("\\", "/")
        for cand in (p + ".ts", p + "/index.ts"):
            if os.path.exists(cand) and not cand.endswith(".spec.ts"):
                srcs.add(cand)
    return srcs


def tag_attrs(tag_body):
    """Attribute names on a tag. Quoted values are blanked first: without that,
    class="btn btn-danger" contributes 'btn' and 'btn-danger' as attributes."""
    body = ATTR_VALUE.sub("=", tag_body)
    return {m.group(1) for m in ATTR_NAME.finditer(body) if m.group(1).strip()}


def bare(name):
    return name.strip("[]()*#")


def collect_directive_selectors(root):
    """selector string -> set of attribute names a tag must carry to match it.
    A compound selector such as [ngModel][dsDebounce] needs both."""
    sel = {}
    for dp, _dn, fn in os.walk(root):
        for f in fn:
            if not f.endswith(".ts") or f.endswith(".spec.ts"):
                continue
            p = os.path.join(dp, f).replace("\\", "/")
            for dm in DIR_SELECTOR.finditer(read(p)):
                sm = SELECTOR_FIELD.search(dm.group(1))
                if not sm:
                    continue
                for part in sm.group(1).split(","):
                    part = part.strip()
                    required = set(BRACKETED.findall(part))
                    if not required or not part.startswith("["):
                        continue
                    sel[part] = required
    return sel


def collect_app_usages(root, selectors):
    usages = {s: [] for s in selectors}
    for dp, _dn, fn in os.walk(root):
        for f in fn:
            if not f.endswith(".html"):
                continue
            p = os.path.join(dp, f).replace("\\", "/")
            for m in TAG.finditer(read(p)):
                names = tag_attrs(m.group(2))
                flat = {bare(n) for n in names}
                for s, required in selectors.items():
                    if required <= flat:
                        usages[s].append((p, names))
    return usages


def deliveries(blob):
    return [name for name, rx in DELIVERIES if rx.search(blob)]


def claim_kinds(body, whole):
    kinds = []
    if NOT_CALLED.search(body):
        kinds.append("S1 a call did not happen")
    for mm in re.finditer(r"expect\s*\(\s*(\w+)\s*\)\s*\.(?:toBeFalse|toBeFalsy)\s*\(", body):
        v = re.escape(mm.group(1))
        if re.search(r"addEventListener[^;]*%s\s*=\s*true" % v, whole):
            kinds.append("S2 my own probe flag stayed false")
    for mm in re.finditer(
            r"expect\s*\(\s*(\w+)\s*\)\s*\.(?:toBeFalsy|toBeNull|toBeUndefined)\s*\(", body):
        v = re.escape(mm.group(1))
        if re.search(r"%s\s*=\s*[^;]*\.query\s*\(" % v, whole):
            kinds.append("S3 the element is absent")
    return sorted(set(kinds))


def main():
    root = sys.argv[1]
    specs = []
    for dp, _dn, fn in os.walk(root):
        for f in fn:
            if f.endswith(".spec.ts"):
                specs.append(os.path.join(dp, f).replace("\\", "/"))
    specs.sort()

    selectors = collect_directive_selectors(root)
    usages = collect_app_usages(root, selectors)

    rows = []
    for spec in specs:
        text = read(spec)
        unit_list = list(units(text))
        srcs = units_under_test(spec, text)
        mech = sorted(os.path.basename(u) for u in srcs if MECHCALL.search(read(u)))

        a_hits, b_hits, claims = [], [], []
        for u in unit_list:
            whole = u["setup"] + "\n" + u["body"]

            for m in PROBE.finditer(whole):
                recv, evt, flag = m.groups()
                if not FIXTURE_RECV.search(recv):
                    continue
                if re.search(r"expect\s*\(\s*%s\s*\)\s*\.(?:toBeFalse|toBeFalsy|toBe\(\s*false)"
                             % re.escape(flag), u["body"]):
                    a_hits.append({"it": u["it"],
                                   "probe": "%s.addEventListener('%s')" % (recv, evt),
                                   "flag": flag})

            if TRIGGER.search(whole) and not REAL_EVENT.search(whole) \
                    and NEG_ASSERT.search(u["body"]):
                b_hits.append(u["it"])

            dl = deliveries(whole)
            kinds = claim_kinds(u["body"], whole)
            if dl and kinds:
                claims.append({"it": u["it"], "claim": kinds, "delivery": dl})

        # End-state-only blocks: assert a queried element is absent, with or without an event.
        # Counted, not adjudicated -- this is the bound on a class the survey does not close.
        end_state = []
        for u in unit_list:
            whole = u["setup"] + "\n" + u["body"]
            for mm in re.finditer(
                    r"expect\s*\(\s*(\w+)\s*\)\s*\.(?:toBeFalsy|toBeNull|toBeUndefined)\s*\(",
                    u["body"]):
                if re.search(r"%s\s*=\s*[^;]*\.query\s*\(" % re.escape(mm.group(1)), whole):
                    end_state.append({"it": u["it"], "delivery": deliveries(whole)})
                    break

        a_other = sorted({m.group(1) for m in ANY_ADD.finditer(text)
                          if FIXTURE_RECV.search(m.group(1))}) if not a_hits else []

        c_hits = []
        for tm in INLINE_TEMPLATE.finditer(text):
            for m in TAG.finditer(tm.group(1)):
                names = tag_attrs(m.group(2))
                flat = {bare(n) for n in names}
                for s, required in selectors.items():
                    if not required <= flat:
                        continue
                    real = usages.get(s, [])
                    if not real:
                        continue
                    common = {}
                    for _p, rn in real:
                        for n in rn:
                            if bare(n) in required:
                                continue
                            common[bare(n)] = common.get(bare(n), 0) + 1
                    missing = sorted(k for k, v in common.items()
                                     if v >= max(1, len(real) // 2) and k not in flat)
                    c_hits.append({"selector": s,
                                   "spec_tag": " ".join(m.group(0).split())[:200],
                                   "app_usages": len(real),
                                   "missing_in_spec_host": missing})

        rows.append({"spec": spec, "A": a_hits, "A_other": a_other, "B": b_hits, "C": c_hits,
                     "claims": claims, "end_state": end_state, "mech_units": mech})

    shaped = [r for r in rows if r["A"] or r["B"]
              or any(c["missing_in_spec_host"] for c in r["C"])]
    claim_rows = [r for r in rows if r["claims"]]
    judged = {r["spec"] for r in rows
              if r["A"] or r["A_other"] or r["B"] or r["C"] or r["claims"]}

    print("spec files scanned                                       : %d" % len(rows))
    print("directive selectors known                                : %d" % len(selectors))
    print("A  probe added after creation, negative assertion         : %d"
          % sum(1 for r in rows if r["A"]))
    print("A- addEventListener on a fixture element, other use       : %d"
          % sum(1 for r in rows if r["A_other"]))
    print("B  triggerEventHandler-only unit with negative assertion  : %d"
          % sum(1 for r in rows if r["B"]))
    print("C  inline host applies a directive in a non-app shape     : %d"
          % sum(1 for r in rows if any(c["missing_in_spec_host"] for c in r["C"])))
    print("C- inline host applies a directive, shape matches app     : %d"
          % sum(1 for r in rows if r["C"] and not any(c["missing_in_spec_host"] for c in r["C"])))
    print("flagged by at least one shape                             : %d" % len(shaped))
    print("no shape detected                                         : %d"
          % (len(rows) - len(shaped)))
    print("---- suppression claims (an event is delivered, then absence is asserted) ----")
    print("spec files carrying at least one suppression claim        : %d" % len(claim_rows))
    print("suppression claim it() blocks                             : %d"
          % sum(len(r["claims"]) for r in claim_rows))
    es_rows = [r for r in rows if r["end_state"]]
    es_all = sum(len(r["end_state"]) for r in es_rows)
    es_del = sum(1 for r in es_rows for e in r["end_state"] if e["delivery"])
    print("---- end-state-only blocks (assert a queried element is absent) ----")
    print("blocks asserting an absent queried element                : %d in %d files"
          % (es_all, len(es_rows)))
    print("   ... with an event delivered in the unit (the census)   : %d" % es_del)
    print("   ... with no event at all (never read by this survey)   : %d" % (es_all - es_del))
    print("---- population bookkeeping ----")
    print("spec files flagged by any pass (read and judged by hand)  : %d" % len(judged))
    print("spec files no pass flagged at all                         : %d" % (len(rows) - len(judged)))
    for r in claim_rows:
        for c in r["claims"]:
            print("  %-100s %-28s %s" % (r["spec"], "+".join(c["delivery"]), c["it"]))
            print("  %-100s %s" % ("", "; ".join(c["claim"])))
    if len(sys.argv) > 2:
        json.dump(rows, open(sys.argv[2], "w", encoding="utf-8"), indent=1)
        print("per-spec rows written to %s" % sys.argv[2])


if __name__ == "__main__":
    main()
