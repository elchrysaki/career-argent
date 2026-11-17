# ARGENT · An atlas of ambition

**A personal, local-first opportunity and research-planning system.**

ARGENT helps you find and rank meaningful programs: research internships, funded summer schools, fellowships, technical conferences, labs, competitions, workshops and speaking opportunities. The public repository contains **only the app, empty templates, and research instructions**. It contains no founder's data, career plans, private opportunities, contacts, transcripts, saved applications or personal preferences.

The visual system uses a single Manrope font family, an ink/graphite/silver palette and a reduced-motion-friendly metallic backdrop. No frontend framework, paid hosting, online database, or npm dependency is required.

## 1. Prerequisites

- **Node.js 20+** and `npm` (from [nodejs.org](https://nodejs.org/)).
- **Git**, for cloning and optional code contributions.
- Optional for automated research: **one** authenticated CLI, [Codex](https://developers.openai.com/codex) or [Claude Code](https://code.claude.com/docs/en/overview). Their network, account and usage costs are separate from ARGENT.
- A browser on your computer.

The site works without an AI account. Automatic daily research requires an installed CLI with **working live web research**. If web access is disabled, the research agent must return zero results instead of inventing grants.

## 2. Install and personalize locally

```bash
git clone <YOUR-PUBLIC-ARGENT-REPOSITORY-URL>
cd career-argent
npm run setup
npm start
```

Open **http://127.0.0.1:4178** (not a deployed public URL). Select **Local preferences** in the sidebar and fill in the questions yourself. This creates or updates `.local/profile.json` only on **your** computer.

You choose what to enter: goals, field/year of study, interests, preferred countries, funding rules, types of opportunities, experience, skills to learn and provider. There are **no prefilled private answers or imported user files**. You can leave optional fields blank.

On the first run ARGENT creates:

```text
.local/                         # NEVER commit this directory
  profile.json                 # private preferences
  opportunities.json           # private opportunities and source citations
  contacts.json                # public researchers you've selected, plus local notes
  learning.json                # AI-suggested skill gaps
  progress.json                # stages, shortlists, application decisions, learning progress
  runs.json                    # local scan history
```

The local server binds strictly to **127.0.0.1**, serves only allowlisted public files, and blocks HTTP requests for `.local/`. No account, cloud database or public sync is involved. Google Fonts may be requested from Google for the optional Manrope appearance; no private profile data is sent with that request. To avoid that external request, remove the two Google Fonts link tags from `index.html` and let the system fallback render.

**Privacy nuance:** running Claude or Codex uses **your provider account**, which receives the research prompt. By default, ARGENT passes a **reduced eligibility/preferences summary**, omitting your name, institution, projects and personal goal statement. The full profile and your existing selected opportunity titles are sent only if you expressly opt in under Local preferences; otherwise deduplication happens locally after the research. If you need completely offline inference with no AI provider, skip the daily CLI and manually import JSON.

## 3. Bring your own Claude or Codex

Authenticate your CLI according to the vendor's official instructions; verify `codex --version` or `claude --version` in your terminal.

**Codex example**:

```bash
npm run research -- --provider=codex --dry-run  # inspect the private prompt, no AI call
npm run research -- --provider=codex            # perform research now
```

**Claude Code example**:

```bash
npm run research -- --provider=claude --dry-run
npm run research -- --provider=claude
```

The runner uses `codex exec` with a read-only sandbox, or `claude -p` with WebSearch/WebFetch tool access. Flags and web capabilities can change with CLI releases; consult the vendor docs if your CLI reports unsupported options. **No unattended permission bypass and no auto-pushing** are enabled. Research may incur paid token/tool usage.

Each run follows `prompts/daily.md` and performs three passes: US, Asia/Middle East, Europe/global. It asks for **up to ten** strong, newly discovered opportunities with current sources, exact financial support and eligible student status. US/Asia leads without an official funding URL are rejected if the user has selected required funding. The runner attempts to add **up to four real research contacts per accepted lead** with public profiles and outreach context. Zero valid opportunities is a successful honest answer.

It also proposes qualification gaps and milestone actions tied to actual program requirements. New leads and contacts are **always marked `review`**, and skills are **suggestions**, never automatically confirmed facts. Source checking remains a human decision.

After a scan, refresh the website or use **Research signals → Refresh private records**. The refreshed opportunities, outreach contacts and learning suggestions are sourced from `.local/` only.

## 4. Schedule daily, on your own machine

Start with a manual scan first. The computer must be on, connected and the CLI authorized; no website can guarantee it will research when your laptop is asleep.

### macOS: 08:30 local time

```bash
node scripts/install-daily.mjs --provider=codex
# OR
node scripts/install-daily.mjs --provider=claude
```

This creates `~/Library/LaunchAgents/io.argent.local-research.plist` and enables a personal **launchd** calendar trigger, using the time chosen in Local preferences (default 08:30). Results and logs remain under `.local/`. To turn off:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/io.argent.local-research.plist
```

### Linux: cron

Run `crontab -e` and add (replace paths with actual absolute paths; use the path to your authenticated `node` CLI):

```cron
30 8 * * * cd /home/USER/career-argent && /usr/bin/node scripts/daily.mjs --provider=codex >> .local/daily.log 2>&1
```

Ensure the agent binary is discoverable in cron's PATH and its credentials work noninteractively. `cron` uses your local system timezone unless configured otherwise.

### Windows

Use **Task Scheduler → Create Basic Task → Daily → 08:30**. Action: start your installed `node.exe`; arguments: `scripts/daily.mjs --provider=claude` (or `codex`); **Start in**: your ARGENT project folder. Windows may require a working agent CLI within Windows or WSL. Test manually first.

## 5. How ranking works

Priority score (0–100): **25% interest fit, 24% demonstrable output, 16% institutional/network value, 15% deadline, 15% funding, 5% application readiness**. Fit is recomputed using each person's private topic preferences. Additional penalties apply for unverified sources, uncertain international eligibility, unfunded US/Asia travel, ineligibility, and closed deadlines. An opportunity can be prestigious but not actionable.

Scores are heuristics, **not acceptance probabilities**. A fully funded internship with a strong mentor and real technical output can outrank a prestigious conference without accommodation or travel support.

## 6. How to verify or add opportunities

Every discovered lead begins with `"verification":"review"`. In your **local** `.local/opportunities.json`, confirm all of:

1. **This cycle's application dates** and enrollment requirements.
2. Citizenship, residence, degree level, current academic year, graduation year, country/visa exclusions and GPA/language requirements.
3. Separate, documented **stipend**, travel, housing, registration waiver, food and insurance. A waived registration fee does **not** mean a funded trip.
4. The primary organizer's URL, exact funding source URL, exact eligibility source URL, and date of checking.
5. Whether outreach is permitted. Identify 3–4 real researchers/program staff only when appropriate.
6. What you'll produce: research output, mentorship, paper, demonstration, talk, industry experience or collaboration.
7. What you're currently missing: skills, study year, publication history or specific references.

Only after verification, set `"verification":"official"` in **your local file**. If ineligible, set `"eligibility":"ineligible"`. Never claim an AI result is manually verified.

You can import JSON through the **Research signals** page. Imports are forced to review-pending and saved locally. To back up your private files, use **Export private data**, save the resulting JSON **outside the repository** or in an encrypted backup, and later use **Research signals → Restore private backup** to restore it on your own machine. Only import trusted backups; restoring replaces current local records and preferences.

### Public templates (no user data)

- `templates/profile.template.json` — blank onboarding/preference fields.
- `templates/opportunities.template.json` — empty private opportunity store format.
- `templates/contacts.template.json` — empty contact list.
- `templates/progress.template.json` — empty application and learning progress.
- `prompts/daily.md` — precise research tasks and AI output contract.
- `prompts/review.md` — human verification procedure.
- `AGENTS.md` / `CLAUDE.md` — Codex and Claude contributor/agent boundaries.

**Never fill a template in place.** The UI fills private files inside `.local/`.

## 7. Public GitHub contribution rules: code only

The starter includes an MIT license with generic ARGENT contributor attribution; maintainers should review whether that license is appropriate **before their first public release**.

The repo is intentionally safe for `git clone`, `git pull`, and public contributions. It **must not** contain generated research records, contact notes, preferences, personal applications, an exported JSON backup, screenshots of private profiles, private transcripts, API keys, or locally generated prompts. There is **no** GitHub Actions job that researches or commits data; public CI only checks structural source and templates.

The `.gitignore` excludes `.local/`, `.env*`, personal backups, and other sensitive paths, even under `git add .`. Additional safeguards:

```bash
npm run audit        # allowlisted source paths + empty template checks
npm run hooks        # after git init/clone, install the Git pre-commit privacy gate
git status --short    # verify ONLY structural source is staged
git diff --cached --name-only
```

A `git add -f` or `--no-verify` can bypass parts of local protection, and editing a public source file to include personal data would defeat any technical guard. **The user remains responsible for reviewing each commit**. GitHub CI reruns the allowlist audit, but never regard it as a perfect PII scanner. If private information has ever been pushed, deleting it in a later commit does not erase the history; rotate leaked secrets and purge history.

For a new public fork, never copy a former private ARGENT database into the project directory. Follow `CONTRIBUTING.md` for clean changes.

## 8. Maintenance and limits

- Application status and profile are persisted as local JSON. No cross-device sync; copy `.local/` through a private encrypted channel if moving machines.
- There is **no auto-email, no auto-LinkedIn message, no auto-apply**, and no silent outreach.
- Daily research is a live external AI request; results require human review, and some sources may block crawling or publish no current grants.
- Links, flags, fees, schedules, student categories and grant deadlines change. Treat all unreviewed listings as unverified.
- A scheduled scan may fail if the CLI cannot perform live web research, user login expires, the computer is offline or provider quotas are reached. See `.local/runs.json` for history.
- Updating the **public app code** with `git pull` does not overwrite private `.local` files.

### Safety check before publishing

```bash
npm test
npm run hooks
git status --short
```

**ARGENT is open structure, private direction.**
