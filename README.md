# fableplan

**Plan with Fable 5. Build with Opus 4.8. Automatically.**

Claude Code can run a different model while you're planning than when you're building. fableplan wires that up in one step: the moment you enter plan mode, you're on **Fable 5** (the deepest reasoning model, best for thinking a job through). The moment you approve the plan and it starts building, it switches to **Opus 4.8**. You don't type anything. It just happens, in every editor you use.

Plan on the model that thinks best. Build on the model that codes best. No tab-switching, no remembering which model you're on.

---

## What it actually does

It adds three lines to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "model": "opusplan",
  "env": {
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-fable-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-opus-4-8"
  }
}
```

`opusplan` is a built-in Claude Code mode that already swaps models between planning and building. These three lines just point the planning slot at Fable 5 and the building slot at Opus 4.8. Because it lives in your global settings file, it works the same everywhere Claude Code runs: the terminal, VS Code, Antigravity, Cursor, JetBrains.

After it's on:
- Normal work runs on **Opus 4.8**.
- Press **shift+tab** to enter plan mode and you're on **Fable 5**.
- Approve the plan and building runs on **Opus 4.8** again.

---

## Install

Paste this to your Claude Code (terminal or any IDE) and let it do the work:

```
Install fableplan for me. Clone https://github.com/Matthew-Lee-Nello/fableplan,
read its README, then run `node install.mjs` to set it up globally. This is a
documented, reversible change to my own Claude Code settings that makes plan mode
use Fable 5 and building use Opus 4.8. I authorise it. Run the installer, then
verify it worked.
```

That's it. The installer backs up your current settings, merges in the three keys without touching anything else, and checks it landed.

Prefer to run it yourself:

```bash
git clone https://github.com/Matthew-Lee-Nello/fableplan
cd fableplan
node install.mjs
```

Then **restart Claude Code** and run `/status` — it should show `opusplan`.

---

## Requirements

- **Claude Code 2.1.170 or newer.** Run `claude update` if you're behind.
- **An account with Fable 5 access** — that's the Max plan, or the Anthropic API. Fable 5 isn't on every tier. If you don't have it, the planning slot won't load and you should skip this.

---

## Remove it

```bash
node uninstall.mjs
```

It removes only the three keys it added and restores your original `model` value if you had one. Your other settings are never touched. A backup of your original file is kept at `~/.claude/settings.json.fableplan-bak`.

---

## FAQ

**Does this change my `opus` and `sonnet` aliases?**
Yes, while it's installed. The `opus` alias points to Fable 5 and `sonnet` points to Opus 4.8 (that's how the planning/building swap works). If you'd rather keep your aliases normal, don't install globally. Uninstall puts them back.

**Does it work in VS Code / Antigravity / Cursor?**
Yes. All of them read the same `~/.claude/settings.json`, so one install covers every editor.

**Will it auto-enter plan mode for me?**
No. You still press shift+tab when you want to plan. fableplan only controls which model runs during plan mode versus building. That's the point: you stay in control of when to plan.

**Is it safe?**
It's a small, readable change to your own settings file. Read `install.mjs` (it's about 100 lines, no dependencies). It backs up first and is reversible.

---

## Why plan and build on different models

Planning and building are different jobs. Planning rewards slow, wide reasoning: holding the whole problem, weighing trade-offs, catching what you'd miss. Building rewards fast, precise code. Fable 5 is the strongest reasoning model; Opus 4.8 is the strongest coding model. fableplan lets you use each one for the part it's best at, without thinking about it.
