# One Trade Templates

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Source-of-truth JSON workflow, task, and form templates for the OneTrade platform. Pure data — no application code, no runtime. Any project that can parse JSON can consume it.

## Workflows

| Workflow | Steps | Directory |
|---|---|---|
| NPQS — Export Consignment & Phytosanitary Registration | 10 | [`templates/npqs/`](templates/npqs/) |
| Customs Declaration | 8 | [`templates/customs/`](templates/customs/) |
| FCAU — Food & Chemical Analysis Unit | 8 | [`templates/fcau/`](templates/fcau/) |
| CDA — Certificate of Domestic Availability | 3 | [`templates/cda/`](templates/cda/) |

## Repository layout

```
templates/        JSON templates, grouped by workflow
manifest.json     generated index: workflows[], byId{} (1:1 id -> path)
docs/             documentation (start here if you have a question)
scripts/          Node tooling: validator, manifest generator
.github/          CI: Prettier, validator, manifest-sync check
```

## Documentation

Each doc under [`docs/`](docs/) is short and focused. Start with whichever question you have:

- [`docs/architecture.md`](docs/architecture.md) — what this repo is, the file tree, how templates reference each other.
- [`docs/conventions.md`](docs/conventions.md) — `id` naming, file and directory naming, the role of each file (`userinput.json`, `workflow.json`, etc.).
- [`docs/lint-rules.md`](docs/lint-rules.md) — the three validator rules and Prettier formatting, with fix recipes.
- [`docs/manifest.md`](docs/manifest.md) — the `manifest.json` schema, the `byId` index, and the CI sync check.
- [`docs/consumption.md`](docs/consumption.md) — how downstream projects consume the repo, with samples in bash, Node, Python, and Go.
- [`docs/workflows.md`](docs/workflows.md) — per-workflow business context.

## Quick start (consumer)

Resolve a template id to its file path via the manifest, then fetch the file:

```bash
BASE=https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main

# 1. Look up the file path for an id
PATH_FOR_ID=$(curl -s "$BASE/manifest.json" | jq -r '.byId["npqs-apply-phyto-cert--user-form"]')
# templates/npqs/1-application/userinput_jsonform.json

# 2. Fetch the template itself
curl -s "$BASE/$PATH_FOR_ID" | jq .
```

The repo is in active development; pin to a commit SHA in place of `main` for reproducible builds. See [`docs/consumption.md`](docs/consumption.md) for production patterns and language-specific examples.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). Every change must pass `npm run check` locally before opening a PR.

## License

Apache License 2.0. See [LICENSE](LICENSE).