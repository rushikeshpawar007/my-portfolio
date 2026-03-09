---
name: validate-i18n
description: Validate that all translation keys are complete and consistent across EN and DE
---

You MUST follow the i18n-management skill validation checklist.

1. Extract all `data-i18n-key` values from `index.html`
2. Extract all keys from the EN and DE translation JSON objects
3. Report:
   - Keys in HTML but missing from EN
   - Keys in HTML but missing from DE
   - Orphan keys in EN/DE with no matching HTML element
   - Keys where default innerHTML does not match EN value
4. If all checks pass, confirm completeness
5. If issues found, list them and offer to fix
