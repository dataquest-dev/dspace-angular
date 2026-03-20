## MENDELU/ORCID author linking in item metadata

### Summary

Adds ORCID profile linking for authors whose `dc.contributor.author` metadata has an ORCID ID in the `authority` field (pattern: `0000-0000-0000-0000`). The author name is rendered as a clickable link to `https://orcid.org/{id}` with an ORCID badge icon.

### Origin

Adapted from `origin/vsb-tuo/orcid-enhancement` (`ab0100b71..13ca15b8b`). Not available in upstream DSpace community.

Changes from VSB-TUO version:
- Angular control flow syntax (`@if`/`@for`)
- Local ORCID SVG icon instead of external URL
- Removed VSB-TUO-specific CSS variables
- Added `encodeURIComponent` for URL safety

### Scope

| Component | Change |
|-----------|--------|
| `MetadataValuesComponent` | ORCID detection, URL generation, template + styling |
| `PlainTextMetadataListElementComponent` | ORCID detection, URL generation, template + styling |

### Tests

- `MetadataValuesComponent` — 10/10 passing (+5 new)
- `PlainTextMetadataListElementComponent` — 7/7 passing (+5 new)
