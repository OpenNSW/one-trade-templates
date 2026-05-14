#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TEMPLATES_DIR = "templates";

function* walkJsonFiles(root) {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        yield full;
      }
    }
  }
}

const failures = [];
const seenIds = new Map();

function fail(file, rule, message) {
  failures.push(`${file}: ${rule}: ${message}`);
}

for (const file of walkJsonFiles(TEMPLATES_DIR)) {
  let obj;
  try {
    obj = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    fail(file, "R1", `not valid JSON: ${err.message}`);
    continue;
  }

  // R1: top-level value must be an object
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    fail(file, "R1", "top-level value must be a JSON object");
    continue;
  }

  // R2: top-level id present and is a non-empty string
  if (!("id" in obj)) {
    fail(file, "R2", 'missing top-level "id" field');
    continue;
  }
  if (typeof obj.id !== "string" || obj.id.length === 0) {
    fail(file, "R2", `"id" must be a non-empty string (got ${JSON.stringify(obj.id)})`);
    continue;
  }

  // R3: id must be globally unique
  if (seenIds.has(obj.id)) {
    fail(file, "R3", `duplicate id "${obj.id}" (also in ${seenIds.get(obj.id)})`);
  } else {
    seenIds.set(obj.id, file);
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(f);
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}

console.log(`OK: ${seenIds.size} templates validated.`);
