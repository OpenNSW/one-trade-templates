# Consuming the templates

How downstream projects use this repo as a data source.

## Pick a consumption pattern

| Pattern | Best for | Setup |
|---|---|---|
| Local checkout + env var | Active dev where both repos change together | Clone this repo; point `ONETRADE_TEMPLATES_PATH` at it. |
| Raw URL on `main` | Dev environments without local disk access (CI, preview deploys) | `curl https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main/...` |
| Raw URL pinned to commit SHA | Staging environments needing reproducibility | Same URL with a `<sha>` instead of `main`. |
| Tagged tarball (post-1.0) | Production | `curl -L .../archive/refs/tags/vX.Y.Z.tar.gz` |
| jsDelivr CDN (post-1.0) | High-traffic browser consumers | `https://cdn.jsdelivr.net/gh/OpenNSW/one-trade-templates@vX.Y.Z/...` |
| Git submodule | Vendored builds | `git submodule add` pinned to tag or SHA. |

## Dev-time access

This repo is in active development. There are no `vX.Y.Z` tags yet. Use one of these three patterns:

### 1. Local checkout (recommended for active iteration)

```bash
git clone https://github.com/OpenNSW/one-trade-templates ../one-trade-templates
```

In the consumer project, read templates relative to an environment variable:

```bash
export ONETRADE_TEMPLATES_PATH=../one-trade-templates
```

The consumer code:

```js
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.env.ONETRADE_TEMPLATES_PATH ?? "./one-trade-templates";
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const path = manifest.byId["npqs-apply-phyto-cert--user-form"];
const template = JSON.parse(readFileSync(join(root, path), "utf8"));
```

Zero network round-trips. Edits in this repo are visible to the consumer immediately.

### 2. Raw URL pinned to `main`

```
https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main/manifest.json
https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main/templates/npqs/1-application/userinput.json
```

⚠ `main` is a moving target — fine for dev environments, not for production. **Do not use `main` in production.** Post-1.0, pin to a tag.

### 3. Raw URL pinned to a commit SHA

When you want reproducibility before tags exist:

```
https://raw.githubusercontent.com/OpenNSW/one-trade-templates/<full-40-char-sha>/manifest.json
```

The consumer's config records the SHA so the same content resolves on every build.

### Don't use jsDelivr during dev

`https://cdn.jsdelivr.net/gh/OpenNSW/one-trade-templates@main/...` caches branch URLs for up to 7 days. Edits to `main` won't be visible to consumers. jsDelivr only becomes appropriate once content is immutable per tag.

## Post-1.0 patterns (planned)

### Tagged tarball

```bash
curl -L https://github.com/OpenNSW/one-trade-templates/archive/refs/tags/v1.0.0.tar.gz \
  | tar xz
# extracts to one-trade-templates-1.0.0/
```

GitHub auto-generates source archives for every tag — no release workflow needed on this side.

### Per-file fetch with CDN

```bash
curl -s https://cdn.jsdelivr.net/gh/OpenNSW/one-trade-templates@v1.0.0/manifest.json
```

Avoids GitHub's raw-URL rate limits. Per-tag URLs are immutable, so jsDelivr caching is correct.

### Git submodule

```bash
git submodule add https://github.com/OpenNSW/one-trade-templates third_party/one-trade-templates
cd third_party/one-trade-templates && git checkout v1.0.0
```

For consumers that want fully reproducible builds without a network fetch at build time.

## Code samples (resolve id → fetch file)

The pattern is always the same: fetch (or read) `manifest.json`, look up the path in `byId`, then read that path.

### bash + jq + curl

```bash
BASE="https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main"
MANIFEST=$(curl -s "$BASE/manifest.json")
PATH_FOR_ID=$(echo "$MANIFEST" | jq -r '.byId["npqs-apply-phyto-cert--user-form"]')
curl -s "$BASE/$PATH_FOR_ID" | jq .
```

### Node.js (no dependencies)

```js
const BASE = "https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main";

async function getTemplate(id) {
  const manifest = await fetch(`${BASE}/manifest.json`).then((r) => r.json());
  const path = manifest.byId[id];
  if (!path) throw new Error(`Unknown template id: ${id}`);
  return fetch(`${BASE}/${path}`).then((r) => r.json());
}

const tpl = await getTemplate("npqs-apply-phyto-cert--user-form");
```

### Python (stdlib only)

```python
import json
from urllib.request import urlopen

BASE = "https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main"

def get_template(template_id):
    manifest = json.load(urlopen(f"{BASE}/manifest.json"))
    path = manifest["byId"].get(template_id)
    if not path:
        raise KeyError(template_id)
    return json.load(urlopen(f"{BASE}/{path}"))

tpl = get_template("npqs-apply-phyto-cert--user-form")
```

### Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const base = "https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main"

func getTemplate(id string) (map[string]any, error) {
    resp, err := http.Get(base + "/manifest.json")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    var manifest struct {
        ByID map[string]string `json:"byId"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
        return nil, err
    }
    path, ok := manifest.ByID[id]
    if !ok {
        return nil, fmt.Errorf("unknown template id: %s", id)
    }
    resp2, err := http.Get(base + "/" + path)
    if err != nil {
        return nil, err
    }
    defer resp2.Body.Close()
    body, _ := io.ReadAll(resp2.Body)
    var tpl map[string]any
    return tpl, json.Unmarshal(body, &tpl)
}
```

## Caching the manifest

The manifest is small (~10 KB at current size, growing slowly). Cache it in memory for the lifetime of a request batch:

- Long-running services: load on startup, refresh periodically.
- Short-lived scripts: fetch once at the top, reuse.

## Versioning (post-1.0)

Semver:

- **Major** (`v2.0.0`): renaming or removing an `id`, breaking schema changes.
- **Minor** (`v1.1.0`): adding workflows, steps, or new ids.
- **Patch** (`v1.0.1`): content edits to existing templates (form copy, field changes that don't change ids).

Consumers should pin to a specific `vX.Y.Z` tag and bump deliberately.

## CORS

GitHub's raw URLs serve `text/plain` with permissive CORS — browser fetches generally work. If you hit issues:

- Use jsDelivr (post-tag) which sets `application/json` and CORS headers correctly.
- Or proxy through your own server.
