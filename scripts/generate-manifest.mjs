#!/usr/bin/env node
// Generates manifest.json from the templates/ tree. The manifest is the
// machine-readable entry point for downstream consumers — it gives them a
// stable id->path index (`byId`) and a structured workflow tree
// (`workflows[]`). Re-run after any change to templates/.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TEMPLATES_DIR = "templates";
const OUTPUT = "manifest.json";

// Human-readable workflow names. To add a new workflow group, add an entry
// here (and update the prefix list in scripts/validate-templates.mjs).
const WORKFLOW_NAMES = {
  cda: "CDA — Certificate of Domestic Availability",
  customs: "Customs Declaration",
  fcau: "FCAU — Food & Chemical Analysis Unit",
  npqs: "NPQS — Export Consignment & Phytosanitary Registration",
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function listJsonFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort();
}

function listSubdirs(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// Step directories are named like "N-kebab-name". Sort by leading number.
function stepSortKey(name) {
  const m = name.match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : Infinity;
}

function buildWorkflow(group) {
  const dir = join(TEMPLATES_DIR, group);
  const definitionName = `${group}_workflow.json`;
  const definitionPath = join(dir, definitionName);
  const definition = readJson(definitionPath);

  const steps = listSubdirs(dir)
    .sort((a, b) => stepSortKey(a) - stepSortKey(b))
    .map((stepName) => {
      const stepDir = join(dir, stepName);
      const files = listJsonFiles(stepDir).map((f) => join(stepDir, f));
      return {
        directory: stepDir + "/",
        files,
      };
    });

  return {
    id: definition.id,
    name: WORKFLOW_NAMES[group] ?? group,
    definition: definitionPath,
    steps,
  };
}

function buildById() {
  const map = {};
  const stack = [TEMPLATES_DIR];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        const obj = readJson(full);
        if (typeof obj?.id === "string") {
          if (map[obj.id]) {
            throw new Error(`duplicate id ${obj.id} in ${full} and ${map[obj.id]}`);
          }
          map[obj.id] = full;
        }
      }
    }
  }
  // Sort keys alphabetically for stable output.
  const sorted = {};
  for (const k of Object.keys(map).sort()) sorted[k] = map[k];
  return sorted;
}

const groups = listSubdirs(TEMPLATES_DIR).sort();
const workflows = groups.map(buildWorkflow);
const byId = buildById();

const manifest = {
  version: "0.0.0-dev",
  generated: "scripts/generate-manifest.mjs",
  workflows,
  byId,
};

writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${OUTPUT}: ${workflows.length} workflows, ${Object.keys(byId).length} templates`);
