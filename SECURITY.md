# Security Policy

TopoViewer renders user-authored YAML, selector stylesheets, labels, Markdown,
SVG icons, image references, Grafana mapper rules, and telemetry labels. Treat
all diagram inputs as untrusted unless the host application explicitly controls
the source.

## Supported Versions

During early access, only the current `0.5.x` development line receives
security fixes. Older commits, archived OpenSpec changes, local lab artifacts,
and generated demo bundles are not supported security-maintenance branches.

## Reporting A Vulnerability

Report suspected vulnerabilities privately to the maintainer before public
disclosure. If GitHub private vulnerability reporting is available for the
repository, use it. Otherwise open a minimal public issue that asks for a
private security contact without including exploit details.

Include:

- a minimal topology, stylesheet, mapper, or Markdown reproducer;
- the host surface: React app, MkDocs, Zensical, Browser Studio, Desktop Studio,
  Grafana panel, or lab;
- browser, Node.js, package, and Grafana versions where relevant;
- whether the content source is trusted, user-authored, mounted, remote, or
  telemetry-derived;
- expected impact, such as script execution, filesystem escape, data leakage,
  denial of service, credential exposure, or unsafe lab guidance.

## In Scope

- Cross-site scripting or HTML/script execution through YAML, labels, callouts,
  Markdown, SVG, images, mapper templates, or telemetry labels.
- Unsafe SVG handling across React, MkDocs, Zensical, Studio, and Grafana
  surfaces.
- YAML parser denial-of-service cases that freeze supported surfaces.
- Grafana mounted-bundle backend path traversal, symlink escape, oversized file,
  role/access-control, or diagnostic leakage issues.
- Package artifacts that accidentally include secrets, local paths, private
  files, generated junk, or lab-only production guidance.
- Dependency vulnerabilities that affect shipped runtime code or packaged
  artifacts.

## Out Of Scope

- Disposable local lab credentials when the docs and scripts clearly mark them
  as lab-only.
- Attacks that require maintainers to run arbitrary untrusted shell commands
  outside documented workflows.
- Vulnerabilities in third-party services or infrastructure not controlled by
  this repository.
- Host-application authorization, tenant isolation, and business-policy checks
  that an embedding product must implement around TopoViewer.

## Security Boundaries

Expected protections:

- Markdown and labels render as inert content unless a host explicitly opts into
  trusted HTML.
- Inline SVG icons are sanitized before use.
- SVG data URLs and unsafe image references are blocked where supported.
- Renderer limits protect against oversized documents and large embedded
  assets.
- Grafana mounted bundles are constrained to configured roots and should not be
  able to read arbitrary container files.

Not guaranteed:

- TopoViewer is not a sandbox for arbitrary hostile HTML or JavaScript.
- TopoViewer does not authenticate or authorize diagram content.
- TopoViewer does not validate business policy unless a host application adds
  that policy.
- Local Grafana/Containerlab labs are not production configurations.

## Dependency Handling

Use `npm audit`, OSV cross-ecosystem scanning, Go vulnerability checks,
CodeQL/static analysis, secret scans, and container-image scans as advisory
signals that require triage. Do not run forced dependency upgrades into release
branches without validating build, visual, interaction, docs, and
package-artifact behavior.

`npm run dependency:advisories` rejects failed, incomplete, or inconsistent npm
audit responses. Production findings are always blocking. Temporary development
exceptions live in `scripts/dependency-audit-exceptions.json`; each is limited
to reviewed advisory URLs, severities, affected ranges, exact locked versions,
and development-only install paths. Transitive findings must resolve to those
same advisories. The policy records an owner and expiry; a new advisory,
different dependency version/path, or expired exception requires a fresh review.
Run `npm run dependency:advisories:test` to exercise these failure cases offline.

### Grafana Image Status (2026-10-09)

The lab and image scan use `grafana/grafana:13.2.3`. A Trivy 0.75.0 scan of
the Linux AMD64 image, repository digest
`sha256:b28bae15e219c998fb0e0424ed724930cc61b1f61fb404d47c862f9a23f9e572`,
reports eight HIGH occurrences and no CRITICAL findings. The four unique CVEs
are CVE-2026-84304 and CVE-2026-84445 in bundled datasource gRPC dependencies,
and CVE-2026-21728 and CVE-2026-28377 in the bundled Tempo dependency.
These are component scan findings; vulnerable-function reachability has not
been established. Grafana 13.2.3 is the latest published patch on the scan date,
and its bundled plugins still require upstream fixes. Scheduled/manual image
scans remain blocking, with no severity downgrade or new ignore entry.
Track resolution in [issue #131](https://github.com/asadarafat/topoviewer/issues/131).

## Automated Security Monitoring

The repository uses scheduled and pull-request security automation as an early
warning system:

- Dependabot checks npm, Go modules, and GitHub Actions weekly. Generated PRs target `development`,
  carry
  `dependencies` and `security` labels, assign the maintainer, and should run
  the same CI and Security workflows as normal changes.
- CodeQL scans JavaScript/TypeScript and Go code on push, pull request,
  schedule, and manual dispatch.
- The Security workflow runs npm audits, OSV cross-ecosystem scanning, Go
  vulnerability checks, secret scanning, public-readiness guardrails, and
  pinned container image scans.
  Third-party lab image scans are visible on push and pull request runs, but
  only scheduled and manual security sweeps block on upstream lab-image CVE
  drift. This keeps normal code review actionable while still surfacing pinned
  Grafana, Prometheus, and gNMIc image risk for triage.
- Scheduled and manual Security workflow runs upload a
  `security-health-report` artifact. The report records the run timestamp,
  repository ref, scanner job results, current open findings, owner, and triage
  state so maintainers have a durable review object even when one scanner fails.
- Third-party image findings that cannot be remediated in this repository stay
  visible as failed scheduled scans and must have a linked tracking issue. Do
  not make those scans green with broad severity downgrades or unbounded ignore
  rules.

Automation does not replace review. Maintainers should triage each generated
PR or finding as one of:

- shipped runtime risk;
- developer-tooling risk;
- lab-only risk;
- upstream false positive or accepted temporary risk;
- blocked by incompatible upstream change.

Before merging dependency or security updates, run `npm run ci` locally or
confirm the equivalent GitHub checks passed, inspect generated docs/package
artifacts when relevant, and note any accepted temporary risk in the change or
release notes. Normal push and pull-request workflows must validate security
state; publishing npm packages or release artifacts remains a separate manual
release decision.
