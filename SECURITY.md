# Security and privacy boundary

ARGENT starts an HTTP server bound to 127.0.0.1. It does not accept remote connections. Static serving is allowlisted, the personal `.local/` folder is never served, and private state-changing API calls require same-origin JSON requests with a local-only header.

Claude/Codex external research **is not offline inference**: the provider receives the prompt and the (default minimal) eligibility summary to perform searches. Turning on detailed profile sharing is opt-in. Users must review provider privacy and authentication policies and avoid entering secrets into personal preference fields.

There is no backend account or public cloud sync, and no GitHub workflow that uploads personal data. The Git privacy audit blocks non-structural tracked files but cannot mathematically guarantee there are no personal details inside permitted source code. Review all public commits.

Security issues should be reported privately to the project's maintainers rather than by publishing credentials or personal data in an issue.
