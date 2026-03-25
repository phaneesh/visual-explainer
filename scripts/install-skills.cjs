#!/usr/bin/env node
/**
 * postinstall — install visual-explainer skills
 *
 * Copies the skill directory from this package into the skill directories used
 * by each AI editor that supports the Anthropic Agent Skills spec, so the skill
 * becomes available automatically without extra setup steps.
 *
 * Supported targets (detected by presence of their config directories):
 *   OpenCode  →  ~/.config/opencode/skill/visual-explainer/
 *   Codex     →  ~/.agents/skills/visual-explainer/
 *
 * The script is intentionally silent on errors so that `npm install` never fails
 * because of missing editors.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'visual-explainer';
const SOURCE_DIR = path.join(__dirname, '..', 'plugins', SKILL_NAME);

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function installTo(targetDir, label, markerDir) {
  // Only install if the editor is actually present (markerDir exists)
  if (!dirExists(markerDir)) return;
  try {
    copyDirRecursive(SOURCE_DIR, targetDir);
    console.log(`[visual-explainer] Skills installed → ${targetDir}`);
  } catch (err) {
    // Non-fatal: log a warning and continue.
    console.warn(`[visual-explainer] Could not install skills for ${label}: ${err.message}`);
  }
}

if (!dirExists(SOURCE_DIR)) {
  console.warn(`[visual-explainer] Source skill directory not found: ${SOURCE_DIR}`);
  process.exit(0);
}

const home = os.homedir();

// OpenCode: ~/.config/opencode/skill/visual-explainer/
installTo(
  path.join(home, '.config', 'opencode', 'skill', SKILL_NAME),
  'OpenCode',
  path.join(home, '.config', 'opencode')
);

// Codex: ~/.agents/skills/visual-explainer/
installTo(
  path.join(home, '.agents', 'skills', SKILL_NAME),
  'Codex',
  path.join(home, '.codex')
);
