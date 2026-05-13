# One Trade Templates

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A Go module that ships workflow and task template JSON files for the OneTrade platform as an embedded filesystem (`embed.FS`). Import this module to get all templates compiled directly into your binary — no runtime file-system dependency.

## Requirements

- **Go 1.25+** (uses `embed.FS`)
- No external dependencies

## Formatting

CI runs JSON linting with `go run ./cmd/jsonlint`.

If CI reports JSON formatting issues, run:

```bash
go run ./cmd/jsonlint -w
```

## Included workflows

| Workflow | Steps | Directory |
|---|---|---|
| NPQS — Export Consignment & Phytosanitary Registration | 10 | `templates/npqs/` |
| Customs Declaration | 8 | `templates/customs/` |
| FCAU — Food & Chemical Analysis Unit | 8 | `templates/fcau/` |
| CDA — Certificate of Domestic Availability | 3 | `templates/cda/` |

Each workflow directory contains:
- A top-level `*_workflow.json` — the composite workflow definition.
- Numbered step subdirectories (e.g. `1-application/`, `2-payment/`) each containing the task template and form JSON files for that step.

## Installation

```bash
go get github.com/OpenNSW/one-trade-templates
```

## Quick start

```go
import onetrade "github.com/OpenNSW/one-trade-templates"

data, err := onetrade.FS.ReadFile("templates/npqs/npqs_workflow.json")
if err != nil {
    log.Fatal(err)
}
_ = data
```

## Usage

### Access the raw FS

```go
import onetrade "github.com/OpenNSW/one-trade-templates"

// onetrade.FS is an embed.FS rooted at the module root.
// All templates live under the "templates/" prefix.
data, err := onetrade.FS.ReadFile("templates/npqs/npqs_workflow.json")
```

### Walk all template files

```go
import (
    "io/fs"
    onetrade "github.com/OpenNSW/one-trade-templates"
)

fs.WalkDir(onetrade.FS, "templates", func(path string, d fs.DirEntry, err error) error {
    if err != nil || d.IsDir() {
        return err
    }
    data, _ := onetrade.FS.ReadFile(path)
    // parse and register data ...
    return nil
})
```

### Strip the "templates/" prefix with a sub-FS

If your loader expects a root-relative FS (no `templates/` prefix):

```go
import (
    "io/fs"
    onetrade "github.com/OpenNSW/one-trade-templates"
)

sub, err := fs.Sub(onetrade.FS, "templates")
if err != nil {
    log.Fatal(err)
}
// sub is now rooted at templates/ — walk "npqs/npqs_workflow.json", etc.
fs.WalkDir(sub, ".", func(path string, d fs.DirEntry, err error) error {
    // ...
    return nil
})
```

### Read a specific workflow definition

```go
import onetrade "github.com/OpenNSW/one-trade-templates"

data, err := onetrade.FS.ReadFile("templates/npqs/npqs_workflow.json")
if err != nil {
    log.Fatal(err)
}

var workflowDef WorkflowDefinition
if err := json.Unmarshal(data, &workflowDef); err != nil {
    log.Fatal(err)
}
```

### Integrate with a template registry loader

If your project has a `loadTemplates` function that accepts an `fs.FS`, pass the sub-FS directly:

```go
import (
    "io/fs"
    onetrade "github.com/OpenNSW/one-trade-templates"
)

sub, _ := fs.Sub(onetrade.FS, "templates")
if err := loadTemplates(registry, sub); err != nil {
    log.Fatal("failed to load templates:", err)
}
```

And update `loadTemplates` to accept `fs.FS` instead of a string path:

```go
func loadTemplates(registry *orchestrator.TaskTemplateRegistry, fsys fs.FS) error {
    return fs.WalkDir(fsys, ".", func(path string, d fs.DirEntry, err error) error {
        if err != nil || d.IsDir() || filepath.Ext(path) != ".json" {
            return err
        }
        data, err := fs.ReadFile(fsys, path)
        if err != nil {
            return err
        }
        // ... unmarshal and register as before
        return nil
    })
}
```

## Template structure

```
templates/
├── npqs/
│   ├── npqs_workflow.json
│   ├── 1-application/
│   │   ├── workflow.json
│   │   ├── userinput.json
│   │   ├── userinput_jsonform.json
│   │   ├── reviewerinput.json
│   │   └── reviewerinput_jsonform.json
│   ├── 2-wait_on_sample/
│   ├── 3-wait_on_lab_results/
│   ├── 4-wait_on_fumigation_decision/
│   ├── 5-check-visual-inspection-requirement/
│   ├── 6-visual-inspection-result/
│   ├── 7-submit-shipping-docs/
│   ├── 8-payment/
│   ├── 9-issue-certificate/
│   └── 10-upload-to-ippc/
├── customs/
│   └── ...
├── fcau/
│   └── ...
├── cda/
│   └── ...
└── <new_group>/
    └── ...
```

## License

Apache License 2.0. See [LICENSE](LICENSE).
