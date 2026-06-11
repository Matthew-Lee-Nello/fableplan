#!/usr/bin/env node
/**
 * fableplan uninstaller — surgically removes exactly what install.mjs added,
 * leaving every other setting (and any pre-existing env vars) intact.
 *
 * Removes:
 *   - "model": "opusplan"                              (only if it's still opusplan)
 *   - env.ANTHROPIC_DEFAULT_OPUS_MODEL   == claude-fable-5
 *   - env.ANTHROPIC_DEFAULT_SONNET_MODEL == claude-opus-4-8
 *
 * If "model" was something else before you installed, the original is restored
 * from the canonical backup (settings.json.fableplan-bak) when available.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'

const PLAN_MODEL = 'claude-fable-5'
const EXEC_MODEL = 'claude-opus-4-8'

const CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
const SETTINGS = join(CONFIG_DIR, 'settings.json')
const BACKUP = `${SETTINGS}.fableplan-bak`

const c = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`)
const warn = (m) => console.log(`${c.yellow}!${c.reset} ${m}`)
const die = (m) => { console.log(`${c.red}✗ ${m}${c.reset}`); process.exit(1) }

console.log(`\n${c.bold}${c.cyan}fableplan${c.reset} — uninstall\n`)

if (!existsSync(SETTINGS)) die(`No settings at ${SETTINGS} — nothing to undo.`)

let settings
try { settings = JSON.parse(readFileSync(SETTINGS, 'utf8') || '{}') }
catch { die(`${SETTINGS} isn't valid JSON. Left it untouched.`) }

// Recover the original "model" value (if any) from the canonical backup.
let originalModel
if (existsSync(BACKUP)) {
  try { originalModel = JSON.parse(readFileSync(BACKUP, 'utf8') || '{}').model } catch { /* ignore */ }
}

// Remove / restore model.
if (settings.model === 'opusplan') {
  if (originalModel && originalModel !== 'opusplan') { settings.model = originalModel; ok(`Restored "model": "${originalModel}".`) }
  else { delete settings.model; ok(`Removed "model": "opusplan".`) }
} else {
  warn(`"model" is "${settings.model ?? '(unset)'}" — not opusplan, left as-is.`)
}

// Remove only the two env keys we added, if they still hold our values.
if (settings.env && typeof settings.env === 'object') {
  if (settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL === PLAN_MODEL) { delete settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL; ok('Removed ANTHROPIC_DEFAULT_OPUS_MODEL.') }
  if (settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL === EXEC_MODEL) { delete settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL; ok('Removed ANTHROPIC_DEFAULT_SONNET_MODEL.') }
  if (Object.keys(settings.env).length === 0) delete settings.env
}

const tmp = `${SETTINGS}.tmp`
writeFileSync(tmp, JSON.stringify(settings, null, 2) + '\n')
renameSync(tmp, SETTINGS)

ok(`Done. Restart Claude Code to return to your normal model.`)
console.log(`${c.dim}Your timestamped backups (settings.json.fableplan-bak*) were left in place.${c.reset}\n`)
