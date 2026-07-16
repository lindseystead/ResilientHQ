# Security Policy

## Supported versions

Security fixes are applied to the latest `main` branch.
Critical fixes may also be backported to active release branches if they exist.

## Reporting a vulnerability

If you discover a security issue, do not open a public GitHub issue.

Use GitHub Private Vulnerability Reporting (Security Advisories) for this repository. If that option is unavailable, contact a maintainer through a private GitHub channel.

Include:

- a clear description of the issue
- reproduction steps or proof of concept
- affected commit, file path, or feature area
- impact and suggested mitigation if known

You can expect:

- acknowledgment within 3 business days
- ongoing status updates during triage and remediation
- credit in release notes (if desired) after the issue is fixed

## Disclosure policy

- We investigate all credible reports.
- We prioritize fixes based on user impact and exploitability.
- We coordinate responsible disclosure timing with reporters.

## Scope highlights

Priority areas for this repository:

- authentication and authorization boundaries
- AI proxy request validation, safety behavior, and rate limiting
- storage/export/delete flows handling user data
- dependency vulnerabilities in production dependencies
