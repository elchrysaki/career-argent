# ARGENT — An Atlas of Ambition

ARGENT is a **local-first research opportunity atlas** that helps people track funded internships, fellowships, workshops and conferences, plan applications, and build the skills for long-term research goals.

## Privacy first

Only public application code and blank templates belong in this repository. Each user’s preferences, applications, research results and contact notes live under `.local/` **on their own computer**, never in Git. AI research requires a separately authenticated Claude or Codex CLI and may send a redacted eligibility summary to that provider.

## Installation

The full public starter is supplied as `ARGENT_Public_Local_First_Starter.zip` in the project delivery. Extract its contents into a dedicated `career-argent` directory and commit the structural files from that directory only. Do **not** run `git init` or `git add .` from `~` (your Mac home directory).

Prerequisites: Node.js 20+ and Git. After installing the complete starter, run:

```bash
npm run setup
npm test
npm run hooks
npm start
```

Open `http://127.0.0.1:4178`. To run research with your own authenticated CLI: `npm run research -- --provider=codex` or `npm run research -- --provider=claude`. See the complete starter README for daily schedules, funding verification and privacy safeguards.

**Never commit `.local/`, `.env`, backups, personal documents, application decisions or generated research outputs.**

The full code and runtime are being added separately. This initial repository documentation is not a deployed website.
