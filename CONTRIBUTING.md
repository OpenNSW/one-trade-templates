# Contributing

Thanks for contributing. This repo ships JSON templates only — no application code. Changes are small JSON edits 95% of the time. The other 5% (adding a step or a workflow) is described below.

## Local setup

Requires **Node.js 20+**. Clone, then:

```bash
npm install         # installs prettier locally
npm run validate    # confirms the repo is healthy on your machine
```

You should now be able to run any of `npm run lint`, `npm run format`, `npm run validate`, `npm run manifest`, `npm run check`.

## How to make a change

### Edit content in an existing template

1. Edit the JSON file directly.
2. Run `npm run format && npm run validate && npm run manifest`.
3. Commit the file + any resulting `manifest.json` diff.

### Add a new step to an existing workflow

1. Create `templates/<group>/N-snake_case_name/` with the appropriate task and form files (see existing steps for reference).
2. Choose `id` values following [`docs/conventions.md`](docs/conventions.md). They must be globally unique.
3. Update the parent `templates/<group>/<group>_workflow.json` to reference the new step's `task_template_id`.
4. Run `npm run check`.

### Add a new workflow group

1. Create `templates/<group>/` with a top-level `<group>_workflow.json`.
2. Add a human-readable name to the `WORKFLOW_NAMES` map in [`scripts/generate-manifest.mjs`](scripts/generate-manifest.mjs).
3. Add a row to the workflows table in `README.md` and a section to [`docs/workflows.md`](docs/workflows.md).
4. Run `npm run check`.

## Pre-submission checklist

Copy this into your PR description and tick each item:

- [ ] `npm run format` produced no diff (or all formatting is committed)
- [ ] `npm run validate` passes — all three rules in [`docs/lint-rules.md`](docs/lint-rules.md)
- [ ] `npm run manifest` produced no diff (manifest is up to date)
- [ ] Every new/changed file is a top-level JSON object (`{...}`)
- [ ] Every new/changed `id` follows the naming guideline in [`docs/conventions.md`](docs/conventions.md)
- [ ] Every `task_template_id` reference resolves to an existing `id` in `manifest.json#byId`
- [ ] PR description names which workflow group(s) are touched

The single command that runs all three automated checks together:

```bash
npm run check
```

This is what CI runs. If `npm run check` is green locally, CI will be green.

## Things to watch out for

- **`task_type` is not an `id` reference.** Values like `"PAYMENT"`, `"WAIT_FOR_EVENT"`, `"SIMPLE_FORM"` in a `task_type` field are engine enum primitives. They are a separate namespace from template ids.
- **Step directory names are part of the convention.** Use `N-snake_case_name` (number prefix, dash separator, then lowercase `snake_case`). The number determines display and processing order.
- **Don't hand-edit `manifest.json`.** It is generator output. Run `npm run manifest` and commit the result.
- **Don't bypass Prettier.** Custom formatting will be reformatted in CI and you'll get a diff back. Run `npm run format` first.

## Reporting bugs / proposing changes

Open a GitHub issue. For substantive changes (new workflow, schema modifications), open the issue first so the approach can be agreed before you write the JSON.
