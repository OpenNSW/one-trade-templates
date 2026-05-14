## Summary

<!-- One or two sentences: what changed and why. -->

## Workflow group(s)

<!-- cda / customs / fcau / npqs — or "tooling" / "docs" if no template content changed. -->

## Checklist

- [ ] `npm run format` produced no diff (or all formatting is committed)
- [ ] `npm run validate` passes — all three rules in [`docs/lint-rules.md`](docs/lint-rules.md)
- [ ] `npm run manifest` produced no diff (manifest is up to date)
- [ ] Every new/changed `id` follows the naming guideline in [`docs/conventions.md`](docs/conventions.md)
- [ ] Every `task_template_id` reference resolves to an existing `id` in `manifest.json#byId`
