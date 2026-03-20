#!/usr/bin/env node
/**
 * postinstall — sync knowledge/classcad-skill submodule + copy API source docs.
 *
 * 1. Submodule: if local changes → skip, otherwise fetch & ff-merge latest.
 * 2. Copy @classcad/api-js doc/apis/v1/* → knowledge/classcad-api/
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, cpSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sub = resolve(root, "knowledge/classcad-skill");

const run = (cmd, opts = {}) =>
  execSync(cmd, { encoding: "utf8", stdio: "pipe", ...opts }).trim();

// ── Bootstrap: if submodule dir is empty / not yet initialised ──────────────
if (!existsSync(resolve(sub, ".git"))) {
  console.log("[sync-submodule] Initialising submodule …");
  try {
    run("git submodule update --init --recursive knowledge/classcad-skill", {
      cwd: root,
    });
    console.log("[sync-submodule] Submodule initialised.");
  } catch (err) {
    console.warn(
      "[sync-submodule] Could not init submodule (offline?). Skipping."
    );
  }
  process.exit(0);
}

// ── Check for local changes ─────────────────────────────────────────────────
const status = run("git status --porcelain", { cwd: sub });
if (status.length > 0) {
  console.log(
    "[sync-submodule] Local changes detected in knowledge/classcad-skill — skipping update."
  );
  process.exit(0);
}

// ── Pull latest ─────────────────────────────────────────────────────────────
try {
  console.log("[sync-submodule] Fetching latest classcad-skill …");
  run("git fetch origin", { cwd: sub });
  const remote = run("git rev-parse origin/master", { cwd: sub });
  const local = run("git rev-parse HEAD", { cwd: sub });
  if (remote !== local) {
    run("git checkout master", { cwd: sub });
    run("git merge --ff-only origin/master", { cwd: sub });
    console.log(`[sync-submodule] Updated to ${remote.slice(0, 10)}`);
  } else {
    console.log("[sync-submodule] Already up to date.");
  }
} catch (err) {
  console.warn("[sync-submodule] Fetch failed (offline?). Keeping current revision.");
}

// ── Copy @classcad/api-js docs into knowledge/classcad-api ────────────────────────
const apiDocs = resolve(root, "node_modules/@classcad/api-js/doc/apis/v1");
const target = resolve(root, "knowledge/classcad-api");

if (existsSync(apiDocs)) {
  mkdirSync(target, { recursive: true });
  cpSync(apiDocs, target, { recursive: true });
  console.log("[sync-submodule] Copied @classcad/api-js docs → knowledge/classcad-api/");
} else {
  console.warn("[sync-submodule] @classcad/api-js docs not found — skipping copy.");
}
