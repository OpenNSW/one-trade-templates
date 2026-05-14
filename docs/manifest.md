# `manifest.json`

The manifest is the machine-readable entry point for downstream consumers. It is **checked into the repo** so consumers can fetch it directly without running a build step.

## Schema

```jsonc
{
  "version": "0.0.0-dev",          // semver tag once the repo leaves dev; "0.0.0-dev" on main
  "generated": "scripts/generate-manifest.mjs",
  "workflows": [
    {
      "id": "npqs-export-phytosanitary-reg",     // matches templates/npqs/npqs_workflow.json#id
      "name": "NPQS — Export Consignment & Phytosanitary Registration",
      "definition": "templates/npqs/npqs_workflow.json",
      "steps": [
        {
          "directory": "templates/npqs/1-application/",
          "files": [
            "templates/npqs/1-application/reviewerinput.json",
            "templates/npqs/1-application/reviewerinput_jsonform.json",
            "templates/npqs/1-application/userinput.json",
            "templates/npqs/1-application/userinput_jsonform.json",
            "templates/npqs/1-application/workflow.json"
          ]
        }
        // ... more steps
      ]
    }
    // ... more workflows
  ],
  "byId": {
    "cda-apply-cert--reviewer-form": "templates/cda/1-application/reviewerinput_jsonform.json",
    "cda-apply-cert--reviewer-review": "templates/cda/1-application/reviewerinput.json",
    // ... 93 entries total, sorted alphabetically by id
  }
}
```

## Two indexes, two use cases

### `workflows[]` — structured tree

Use when you need to load a whole workflow group, or display the workflows hierarchically (admin UI, docs generator). Steps are listed in their original numeric order (`1-…`, `2-…`, …), so iteration matches workflow execution order.

### `byId{}` — flat id → path map

The killer feature for **selective loading**. Lookups are O(1):

```js
const path = manifest.byId["npqs-apply-phyto-cert--user-form"];
// → "templates/npqs/1-application/userinput_jsonform.json"
```

The map is sorted alphabetically by id so diffs stay small and grep-friendly.

By construction (see [`lint-rules.md`](lint-rules.md) R3), `byId` is a bijection — every id appears once, every path appears once.

## Generation

Produced by [`../scripts/generate-manifest.mjs`](../scripts/generate-manifest.mjs). The generator:

1. Walks `templates/<group>/` to find each top-level `<group>_workflow.json`.
2. For each group, enumerates numbered step directories and the JSON files inside.
3. Reads every file's `id` to build `byId`.
4. Emits stable output (alphabetical `byId` keys, numeric step order, deterministic JSON formatting).

Run locally with `npm run manifest`.

## CI sync check

The CI workflow runs:

```bash
node scripts/generate-manifest.mjs
git diff --exit-code manifest.json
```

If the regenerated manifest differs from the committed one, CI fails. This catches the "added a template but forgot to regenerate" case.

## Why it's committed

- **Consumers don't need a Node toolchain.** A bash + jq script can resolve any id without running any code in this repo.
- **No build step on the consumer side.** The manifest is the artifact.
- **Stable URLs.** `https://raw.githubusercontent.com/.../manifest.json` always reflects the current state of the branch/tag.

## Updating the version

`"version"` in the manifest tracks the latest released tag. During the development phase it stays at `"0.0.0-dev"`. When the repo cuts a release:

1. Bump `"version"` to the new tag (e.g. `"1.0.0"`).
2. Run `npm run manifest && git diff manifest.json` — should show only the version bump.
3. Commit, tag, push.

(For now this is a manual step. A release script can automate it later.)
