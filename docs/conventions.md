# Conventions

## Top-level shape

Every JSON file under `templates/` is a single JSON object (`{...}`). No arrays, no primitives, no nulls at the root. In Go terms, every file deserializes to `map[string]any`. This is enforced by the validator.

## The `id` field

Every file has a top-level `id` field — a non-empty string that uniquely identifies the template across the whole repo. Consumers use the `id` to look up a template via `manifest.json#byId`.

**Uniqueness is enforced.** The naming convention below is **not** machine-checked — it's a contributor-facing guideline. Follow it so the repo stays consistent.

## Naming convention (guideline)

```
<prefix>-<purpose>[-<...>][--<role>[-<...>]]
```

Plain English:

- Lowercase kebab-case throughout (`[a-z0-9-]`). No underscores. No uppercase.
- First segment is the **workflow group prefix** matching the directory name under `templates/`: one of `cda`, `customs`, `fcau`, `npqs`.
- The middle is a kebab-case description of what the template does or which step it belongs to.
- Workflow-level templates (the top of a group, or a step's `workflow.json`) typically end with `-flow` or `-reg`.
- Task-level templates (form definitions, payment actions, wait actions) attach a `--<role>` suffix using a double dash. The role describes the actor or action (`--user-form`, `--user-input`, `--officer-review`, `--reviewer-form`, `--payment`, `--wait`, `--post`).

### Examples

- `npqs-export-phytosanitary-reg` — top-level NPQS workflow
- `npqs-apply-phyto-cert-flow` — step workflow within NPQS
- `npqs-apply-phyto-cert--user-form` — form schema for the user-input role of that step
- `fcau-pay-app-fee--payment` — payment task in FCAU
- `cda-wait-cert--wait-for-event` — wait task in CDA

## Adding a new workflow group

If you add a new workflow group (say `import`):

1. Create `templates/import/` with a top-level `import_workflow.json` and step subdirectories.
2. Add a human-readable name to the `WORKFLOW_NAMES` map in [`../scripts/generate-manifest.mjs`](../scripts/generate-manifest.mjs).
3. Add a row to the workflows table in [`../README.md`](../README.md) and a section to [`workflows.md`](workflows.md).
4. Use `import-` as the prefix for every new `id` in that group (following the naming guideline above).

## File naming within a step directory

Each numbered step directory (`N-snake_case_name/`) typically contains a subset of these files. The names are conventional; the engine resolves files by their `id`, not by filename, but consistent naming helps humans navigate.

| Filename | Role | `task_type` typically used |
|---|---|---|
| `workflow.json` | Step sub-workflow definition | n/a (workflow, not task) |
| `userinput.json` | Task: collect input from the applicant | `SIMPLE_FORM` |
| `userinput_jsonform.json` | JSON Schema form paired with `userinput.json` | n/a (form definition) |
| `reviewerinput.json` | Task: officer/reviewer assessment | `SIMPLE_FORM` |
| `reviewerinput_jsonform.json` | JSON Schema form paired with `reviewerinput.json` | n/a |
| `officerinput.json` | Task: officer-only action (e.g. issuing certificate) | `SIMPLE_FORM` |
| `officerinput_jsonform.json` | JSON Schema form paired with `officerinput.json` | n/a |
| `payment.json` | Task: payment action | `PAYMENT` |
| `register_task_and_wait.json` | Task: register external work + wait for completion | `WAIT_FOR_EVENT` |
| `register_task_and_wait_jsonform.json` | Optional form schema for the wait task | n/a |
| `http_post.json` | Task: outbound HTTP POST | `HTTP_POST` |
| `submit.json`, `submitinput_jsonform.json` | Task: submission action with associated form | varies |
| `waitack.json` | Task: wait for asynchronous acknowledgement | `WAIT_FOR_EVENT` |
| `exam.json`, `release.json`, `warranting.json`, `wait_cert.json` | Domain-specific task variants | varies |

## Step directory naming

```
N-snake_case_name/
```

- `N` is a positive integer that determines step order within the workflow group (1, 2, 3 …).
- After the leading `N-`, the identifier is lowercase `snake_case` (words separated by underscores). Example: `5-check_visual_inspection_requirement/`.
- Step directories live directly under `templates/<group>/`. There are no nested step directories.

## File naming

JSON file names use lowercase `snake_case`. Example: `register_task_and_wait_jsonform.json`. Single-word names (`workflow.json`, `payment.json`) are also valid.

Note: file naming is distinct from `id` naming. File names use `snake_case`; `id` values use `kebab-case` with `--<role>` suffixes (see the convention above).

## Top-level workflow file naming

```
templates/<group>/<group>_workflow.json
```

Exactly one per group. Its `id` ends with `-reg` by convention (registration / workflow root).
