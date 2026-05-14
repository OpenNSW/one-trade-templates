# Lint rules

CI runs three checks. All three also run locally via `npm run check`.

| Check | Tool | Command |
|---|---|---|
| Formatting (syntax + indent + line endings + final newline) | Prettier 3 | `npm run lint` (check) / `npm run format` (fix) |
| Structural rules R1–R3 | `scripts/validate-templates.mjs` | `npm run validate` |
| `manifest.json` is up to date with `templates/` | `scripts/generate-manifest.mjs` + `git diff` | `npm run manifest` then check no diff |

## Prettier configuration

Configured by [`../.prettierrc.json`](../.prettierrc.json):

- 2-space indent
- LF line endings
- final newline required
- JSON parser
- **Arrays are always multi-line** — even two-element arrays like `["phyto", "reexport"]` are forced onto multiple lines. Enforced by the [`prettier-plugin-multiline-arrays`](https://www.npmjs.com/package/prettier-plugin-multiline-arrays) plugin with `multilineArraysWrapThreshold: 0`.

[`../.prettierignore`](../.prettierignore) excludes `node_modules`, `.git`, and `manifest.json` (the manifest is generator-owned).

`.editorconfig` mirrors the indent/line-ending rules so editors do the right thing before Prettier runs.

## Structural rules (validator)

`scripts/validate-templates.mjs` enforces three things:

### R1 — Top-level value must be a JSON object

```json
// pass
{ "id": "npqs-foo--bar", ... }

// fail
[ "not an object" ]
"not an object"
null
```

The engine treats every template as a map-shaped value. Arrays and primitives at the top level have no defined meaning.

### R2 — Top-level `id` field present, non-empty string

```json
// pass
{ "id": "npqs-foo--bar", ... }

// fail
{ "name": "missing id" }
{ "id": "" }
{ "id": 42 }
```

Without `id`, the template can't appear in `manifest.json#byId` and can't be referenced by `task_template_id`.

### R3 — All `id` values are globally unique

```
templates/customs/3-warranting/workflow.json: R3: duplicate id "customs-warranting-flow" (also in templates/customs/3-warranting/warranting.json)
```

Fix: rename one of them. See the `--<role>` suffix pattern in [`conventions.md`](conventions.md) for disambiguation.

## What's NOT enforced

- **The naming convention** described in [`conventions.md`](conventions.md) is a contributor-facing guideline, not a machine-checked rule. Future contributors should follow it for consistency; the validator does not block non-conforming ids.
- **Reference integrity** (every `task_template_id` resolves to a real `id`). Not enforced by the validator today. The contributor checklist in [`../CONTRIBUTING.md`](../CONTRIBUTING.md) asks contributors to verify it manually.
- **Schema of the template contents themselves.** The validator does not check that a `workflow.json` has well-formed `nodes` and `edges`, or that form schemas are valid JSON Schema.

## Common failure → fix recipes

| Symptom | Fix |
|---|---|
| `R1: top-level value must be a JSON object` | Wrap the content in `{ ... }` and add an `id`. |
| `R2: missing top-level "id" field` | Add `"id": "<prefix>-..."` as the first key. |
| `R3: duplicate id "..."` | Choose a more specific id, typically by adding/changing the `--<role>` suffix. |
| `manifest.json` diff after `npm run manifest` | Commit the manifest change. It's part of the PR. |
| Prettier check fails locally | `npm run format` and commit the diff. |
| Prettier check passes locally but CI fails | Line endings: ensure your editor/git respects `.gitattributes` (LF for `.json`). Run `git ls-files --eol templates` to inspect. |
