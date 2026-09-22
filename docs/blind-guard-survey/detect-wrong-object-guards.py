#!/usr/bin/env python3
"""
Survey the Karma spec suite for guards that assert over an object the running
application never builds.

Three shapes are measured independently; a spec can carry more than one.

  A  a DOM probe attached with addEventListener to a fixture element AFTER the
     component exists, whose non-firing is the proof that production code
     suppressed an event.  Angular coalesces template (event) bindings onto one
     native listener, so a listener added afterwards is a second native listener
     -- the only kind stopImmediatePropagation() can reach.

  B  an it() block whose only event delivery is triggerEventHandler() and whose
     claim is a negative assertion.  triggerEventHandler invokes the bindings
     recorded on the DebugElement directly; it never enters the DOM event
     system, and it is a no-op when the binding is absent.

  C  an inline test-host template that applies a directive under test in a shape
     no real template in src/ uses.

The detector reports candidates.  A candidate is only called blind after a
negative control (see SURVEY.md); the script does not decide that.

usage:  python detect-wrong-object-guards.py <src-root> [out.json]
"""
import json
import os
import re
import sys

IT_START = re.compile(r"\b(?:it|fit|xit)\s*\(\s*(['\"`])(.*?)\1", re.S)
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
INLINE_TEMPLATE = re.compile(r"template\s*:\s*`(.*?)`", re.S)
TAG = re.compile(r"<([A-Za-z][\w-]*)((?:[^<>'\"]|'[^']*'|\"[^\"]*\")*?)/?>", re.S)
ATTR_NAME = re.compile(r"(\[\([\w.$-]+\)\]|\[[\w.$-]+\]|\([\w.$-]+\)|[*#]?[\w.$-]+)\s*(?==|\s|$)")
DIR_SELECTOR = re.compile(r"@Directive\s*\(\s*\{(.*?)\}\s*\)", re.S)
SELECTOR_FIELD = re.compile(r"selector\s*:\s*['\"`]([^'\"`]+)['\"`]")


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


def balanced_block(text, start):
    """text[start] begins an it( call; return the source of the whole call."""
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
                return text[start:j + 1]
        j += 1
    return text[start:]


def it_blocks(text):
    clean = strip_comments(text)
    return [(m.group(2), balanced_block(clean, m.start())) for m in IT_START.finditer(clean)]


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
    return {m.group(1) for m in ATTR_NAME.finditer(tag_body) if m.group(1).strip()}


def bare(name):
    return name.strip("[]()*#")


def collect_directive_selectors(root):
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
                    if part.startswith("[") and part.endswith("]"):
                        sel.setdefault(part[1:-1], set()).add(p)
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
                for s in selectors:
                    if s in flat:
                        usages[s].append((p, names))
    return usages


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
        blocks = it_blocks(text)
        units = units_under_test(spec, text)
        mech = sorted(os.path.basename(u) for u in units if MECHCALL.search(read(u)))

        a_hits = []
        for title, body in blocks:
            for m in PROBE.finditer(body):
                recv, evt, flag = m.groups()
                if not FIXTURE_RECV.search(recv):
                    continue
                if re.search(r"expect\s*\(\s*%s\s*\)\s*\.(?:toBeFalse|toBeFalsy|toBe\(\s*false)"
                             % re.escape(flag), body):
                    a_hits.append({"it": title,
                                   "probe": "%s.addEventListener('%s')" % (recv, evt),
                                   "flag": flag})
        a_other = sorted({m.group(1) for m in ANY_ADD.finditer(text)
                          if FIXTURE_RECV.search(m.group(1))}) if not a_hits else []

        b_hits = [title for title, body in blocks
                  if TRIGGER.search(body) and not REAL_EVENT.search(body)
                  and NEG_ASSERT.search(body)]

        claims = []
        for title, body in blocks:
            delivery = [n for n, p in (("native .click()", r"\.click\s*\(\s*\)"),
                                       ("dispatchEvent", r"\.dispatchEvent\s*\("),
                                       ("triggerEventHandler", r"\.triggerEventHandler\s*\("),
                                       ("addEventListener probe", r"\.addEventListener\s*\("))
                        if re.search(p, body)]
            if not delivery:
                continue
            kinds = []
            if re.search(r"\.not\s*\.\s*toHaveBeenCalled|\.toHaveBeenCalledTimes\s*\(\s*0\s*\)", body):
                kinds.append("S1 a call did not happen")
            for mm in re.finditer(r"expect\s*\(\s*(\w+)\s*\)\s*\.(?:toBeFalse|toBeFalsy)\s*\(", body):
                v = re.escape(mm.group(1))
                if re.search(r"addEventListener[^;]*%s\s*=\s*true" % v, body):
                    kinds.append("S2 my own probe flag stayed false")
            for mm in re.finditer(r"expect\s*\(\s*(\w+)\s*\)\s*\.(?:toBeFalsy|toBeNull|toBeUndefined)\s*\(", body):
                v = re.escape(mm.group(1))
                if re.search(r"%s\s*=\s*[^;]*\.query\s*\(" % v, body):
                    kinds.append("S3 the element is absent")
            if kinds:
                claims.append({"it": title, "claim": sorted(set(kinds)),
                               "delivery": delivery})

        c_hits = []
        for tm in INLINE_TEMPLATE.finditer(text):
            for m in TAG.finditer(tm.group(1)):
                names = tag_attrs(m.group(2))
                flat = {bare(n) for n in names}
                for s in selectors:
                    if s not in flat:
                        continue
                    real = usages.get(s, [])
                    if not real:
                        continue
                    common = {}
                    for _p, rn in real:
                        for n in rn:
                            if bare(n) == s:
                                continue
                            common[bare(n)] = common.get(bare(n), 0) + 1
                    missing = sorted(k for k, v in common.items()
                                     if v >= max(1, len(real) // 2) and k not in flat)
                    c_hits.append({"selector": s,
                                   "spec_tag": " ".join(m.group(0).split())[:200],
                                   "app_usages": len(real),
                                   "missing_in_spec_host": missing})

        rows.append({"spec": spec, "A": a_hits, "A_other": a_other, "B": b_hits, "C": c_hits,
                     "claims": claims, "mech_units": mech})

    flagged = [r for r in rows if r["A"] or r["B"] or any(c["missing_in_spec_host"] for c in r["C"])]
    print("spec files scanned                                       : %d" % len(rows))
    print("directive attribute selectors known                      : %d" % len(selectors))
    print("A  probe added after creation, negative assertion         : %d" % sum(1 for r in rows if r["A"]))
    print("A- addEventListener on a fixture element, other use       : %d" % sum(1 for r in rows if r["A_other"]))
    print("B  triggerEventHandler-only block with negative assertion : %d" % sum(1 for r in rows if r["B"]))
    print("C  inline host applies a directive in a non-app shape     : %d"
          % sum(1 for r in rows if any(c["missing_in_spec_host"] for c in r["C"])))
    print("C- inline host applies a directive, shape matches app     : %d"
          % sum(1 for r in rows if r["C"] and not any(c["missing_in_spec_host"] for c in r["C"])))
    print("flagged by at least one shape                             : %d" % len(flagged))
    print("no shape detected                                         : %d" % (len(rows) - len(flagged)))
    claim_rows = [r for r in rows if r["claims"]]
    print("---- suppression claims (an event is delivered, then absence is asserted) ----")
    print("spec files carrying at least one suppression claim        : %d" % len(claim_rows))
    print("suppression claim it() blocks                             : %d"
          % sum(len(r["claims"]) for r in claim_rows))
    for r in claim_rows:
        for c in r["claims"]:
            print("  %-100s %-28s %s" % (r["spec"], "+".join(c["delivery"]), c["it"]))
            print("  %-100s %s" % ("", "; ".join(c["claim"])))
    if len(sys.argv) > 2:
        json.dump(rows, open(sys.argv[2], "w", encoding="utf-8"), indent=1)
        print("per-spec rows written to %s" % sys.argv[2])


if __name__ == "__main__":
    main()
