# Contributing to ARGENT

We welcome improvements to the generic UI, scoring, accessibility, security, documentation and local AI research tooling. This repository is **not** a public opportunity/person dossier.

1. Make changes in public source code, generic templates or `prompts/`, not `.local/`.
2. Keep all sample preference fields blank and all sample opportunity/contact lists empty.
3. Never add a real user's education, identity, application decisions, personal CV, portfolio records, grant choices or generated research outputs to a commit. Please don't include private screenshots in issues or PRs.
4. Run `npm test` and inspect `git diff --cached --name-only` before publishing.
5. If a feature needs personalization, read it from private local state rather than hard-coding it into the shipped app.
6. Do not add scheduled GitHub workflows that commit user research or personal data. Daily agent runs occur on each user's own computer.

If you accidentally staged private files, use `git restore --staged <file>` and ensure the path is ignored. If you have already pushed secrets or personal data, assume the historical commits are public and act to remove and rotate them appropriately.
