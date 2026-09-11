# Security Policy

## Supported versions

Only the latest released version of `@fransiscuss/ampeco` receives fixes.

## Reporting a vulnerability

Please report security issues privately through
[GitHub Security Advisories](https://github.com/fransiscuss/ampeco-node/security/advisories/new)
rather than opening a public issue. Expect an initial response within 7 days.

This is an unofficial, community-maintained SDK. Vulnerabilities in the AMPECO
platform itself should go to AMPECO, not here.

## Handling credentials

An AMPECO API token authenticates as the admin that created it, so it is a
server-side secret:

- Keep it in environment variables or a secrets manager, never in source control.
- Never ship this package with a token into browser or mobile client code.
- `AmpecoApiError` exposes the raw response body so failures can be diagnosed.
  Redact it before forwarding an error to a log aggregator or issue tracker.
