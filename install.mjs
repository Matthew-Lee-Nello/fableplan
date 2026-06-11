#!/usr/bin/env node
/**
 * fableplan installer
 *
 * Makes Claude Code use Fable 5 while you're in plan mode, and Opus 4.8 the rest
 * of the time. Works in every Claude Code surface (terminal, VS Code, Antigravity,
 * Cursor) because it writes one file they all share: ~/.claude/settings.json.
 *
 * It merges three keys, preserving everything else you already have:
 *   "model": "opusplan"
 *   "env": {
 *     "ANTHROPIC_DEFAULT_OPUS_MODEL":   "claude-fable-5",   // used DURING plan mode
 *     "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-opus-4-8"   // used the rest of the time
 *   }
 *
 * `opusplan` is Claude Code's built-in plan/execute split: it runs the opus slot
 * during plan mode and the sonnet slot otherwise. Remapping those two slots gives
 * you Fable-plans / Opus-executes with no command to type.
 *
 * Safe: backs up your settings first, merges (never overwrites), writes atomically,
 * and verifies. Reversible with `node uninstall.mjs`.
 *
 * Requirements: Claude Code >= 2.1.170, and an account with Fable 5 access
 * (Max plan or the Anthropic API). No npm dependencies.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import { readFileSync, writeFileSync, existsSync, copyFileSync, renameSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const PLAN_MODEL = 'claude-fable-5'
const EXEC_MODEL = 'claude-opus-4-8'

// Honour a relocated config dir if the user set one, else the default.
const CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
const SETTINGS = join(CONFIG_DIR, 'settings.json')

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
}
const log = (m) => console.log(m)
const ok = (m) => log(`${c.green}✓${c.reset} ${m}`)
const warn = (m) => log(`${c.yellow}!${c.reset} ${m}`)
const die = (m) => { log(`${c.red}✗ ${m}${c.reset}`); process.exit(1) }

log(`\n${c.bold}${c.cyan}fableplan${c.reset} — Fable 5 plans, Opus 4.8 executes\n`)

// 1. Preflight: Claude Code present + new enough. Warn, never block.
try {
  const v = execSync('claude --version', { encoding: 'utf8' }).trim()
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/)
  ok(`Claude Code detected: ${v}`)
  if (m) {
    const [maj, min, pat] = [+m[1], +m[2], +m[3]]
    const tooOld = maj < 2 || (maj === 2 && (min < 1 || (min === 1 && pat < 170)))
    if (tooOld) warn(`Fable 5 needs Claude Code >= 2.1.170. Run "claude update" then re-run this.`)
  }
} catch {
  warn(`Couldn't run "claude --version" — is Claude Code installed and on your PATH? Continuing anyway.`)
}

warn(`${c.bold}This needs an account with Fable 5 access${c.reset} (Max plan or the Anthropic API).`)
warn(`While installed, the ${c.bold}opus${c.reset} alias resolves to Fable and ${c.bold}sonnet${c.reset} to Opus. Undo any time: ${c.bold}node uninstall.mjs${c.reset}\n`)

// 2. Load current settings (or start fresh). Never clobber a file we can't parse.
mkdirSync(CONFIG_DIR, { recursive: true })
let settings = {}
let raw = ''
if (existsSync(SETTINGS)) {
  raw = readFileSync(SETTINGS, 'utf8')
  if (raw.trim()) {
    try {
      settings = JSON.parse(raw)
    } catch {
      die(`${SETTINGS} exists but isn't valid JSON. Fix or move it, then re-run. (Left it untouched.)`)
    }
  }
  ok(`Found existing settings: ${SETTINGS}`)
} else {
  ok(`No settings yet — creating ${SETTINGS}`)
}

// 3. Back up the original once (canonical pre-install snapshot for uninstall) plus
//    a timestamped copy every run for extra safety.
if (existsSync(SETTINGS)) {
  const canonical = `${SETTINGS}.fableplan-bak`
  if (!existsSync(canonical)) { copyFileSync(SETTINGS, canonical); ok(`Backed up original → ${canonical}`) }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  copyFileSync(SETTINGS, `${SETTINGS}.fableplan-bak.${stamp}`)
}

// 4. Merge our three keys, preserving everything else.
const before = { model: settings.model, env: { ...(settings.env || {}) } }
settings.model = 'opusplan'
settings.env = { ...(settings.env || {}), ANTHROPIC_DEFAULT_OPUS_MODEL: PLAN_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL: EXEC_MODEL }

if (before.model && before.model !== 'opusplan') warn(`Your "model" was "${before.model}" → now "opusplan" (uninstall restores it).`)

// 5. Write atomically (temp file + rename), then verify.
const tmp = `${SETTINGS}.tmp`
writeFileSync(tmp, JSON.stringify(settings, null, 2) + '\n')
renameSync(tmp, SETTINGS)

const check = JSON.parse(readFileSync(SETTINGS, 'utf8'))
if (check.model !== 'opusplan' || check.env?.ANTHROPIC_DEFAULT_OPUS_MODEL !== PLAN_MODEL || check.env?.ANTHROPIC_DEFAULT_SONNET_MODEL !== EXEC_MODEL) {
  die(`Verification failed — the keys didn't land. Restore from ${SETTINGS}.fableplan-bak if needed.`)
}
ok(`Installed. Merged 3 keys, preserved ${Object.keys(settings).length - 2} other setting group(s).`)

// 6. Next steps.
log(`\n${c.bold}Done.${c.reset} Now:`)
log(`  ${c.dim}1.${c.reset} Restart Claude Code (settings load at session start).`)
log(`  ${c.dim}2.${c.reset} Run ${c.bold}/status${c.reset} — it should show model ${c.bold}opusplan${c.reset}.`)
log(`  ${c.dim}3.${c.reset} Press ${c.bold}shift+tab${c.reset} to enter plan mode → you're on ${c.bold}Fable 5${c.reset}.`)
log(`  ${c.dim}4.${c.reset} Approve the plan → execution switches to ${c.bold}Opus 4.8${c.reset} automatically.`)
log(`\n${c.dim}Undo any time: node uninstall.mjs${c.reset}\n`)
