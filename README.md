# @fransiscuss/ampeco

[![CI](https://github.com/fransiscuss/ampeco-node/actions/workflows/ci.yml/badge.svg)](https://github.com/fransiscuss/ampeco-node/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40fransiscuss%2Fampeco)](https://www.npmjs.com/package/@fransiscuss/ampeco)
[![node](https://img.shields.io/node/v/%40fransiscuss%2Fampeco)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/%40fransiscuss%2Fampeco)](LICENSE)

An unofficial, hand-written TypeScript SDK for the [AMPECO EV Charging Platform Public API](https://developers.ampeco.com). It is designed for Node.js 20+ backend services and is not affiliated with AMPECO.

The API token is a server secret. Do not bundle this package with a token into browser code.

## Install

```sh
npm install @fransiscuss/ampeco
```

## Getting started

```ts
import { AmpecoClient, ValueSets } from "@fransiscuss/ampeco";

const ampeco = new AmpecoClient({
  tenantUrl: process.env.AMPECO_TENANT_URL!,
  apiKey: process.env.AMPECO_API_KEY!,
});

// Cursor pagination is transparent when streaming.
for await (const chargePoint of ampeco.chargePoints.stream({
  type: ValueSets.ChargePointType.Public,
})) {
  console.log(chargePoint.id, chargePoint.name, chargePoint.networkStatus);
}

await ampeco.chargePoints.startCharging(123, 456, {
  userId: 789,
  stopConditions: { maxEnergyKwh: 20 },
});
```

`startCharging()` returns the optional command payload AMPECO supplies with HTTP 202 (including `success`, `sessionId`, and `errorCode` when present). A 202 alone only means the command was accepted; check `success` when your tenant returns this payload.

Use one `AmpecoClient` per tenant/token. It is safe to reuse across concurrent requests.

## API surface

`AmpecoClient` groups operations by resource:

| Property | Operations |
| --- | --- |
| `chargePoints` | CRUD, status, start/stop, reset, availability, unlock, reserve |
| `evses` | CRUD, start charging |
| `locations`, `users`, `tariffs`, `partners` | CRUD (`tariffs.replace` is also available) |
| `sessions` | listing/streaming, expansions, custom fields, tariff/user/payment actions |
| `transactions` | CRUD and pre-authorizations |
| `reservations` | reads/listing and cancellation |
| `cdrs`, `invoices`, `receipts`, `subscriptions` | read/list/stream |
| `roaming` | roaming operators and `roaming.connections` |

All single-resource responses are unwrapped from AMPECO's `{ data: ... }` envelope. All list clients provide `getPage()` and `stream()`. Filters are regular camel-case objects and are serialized as AMPECO deep-object query parameters, for example `filter[userId]=123`.

```ts
const page = await ampeco.sessions.getPage(
  { status: ValueSets.SessionStatus.Active },
  { withPriceBreakdown: true },
  { perPage: 50 },
);

for await (const session of ampeco.sessions.stream({ userId: 123 })) {
  // follows `next_cursor` automatically
}
```

## Errors

Non-2xx responses throw `AmpecoApiError`. It retains the HTTP status, raw response, response headers, and per-field validation messages returned by HTTP 422. The raw body can contain customer data, so redact it before forwarding an error to a log aggregator — see [SECURITY.md](SECURITY.md).

```ts
import { AmpecoApiError } from "@fransiscuss/ampeco";

try {
  await ampeco.users.create({ email: "user@example.com" });
} catch (error) {
  if (error instanceof AmpecoApiError && error.status === 422) {
    console.error(error.errors);
  }
}
```

## Development

```sh
npm ci
npm run check
npm test
npm run integration
npm run build
npm pack --dry-run
```

`npm run integration` is a deterministic local HTTP harness; it uses no AMPECO credentials. A live charging lifecycle smoke test should be run privately against a dedicated sandbox charger and must never be committed with tenant credentials or identifiers.

## Release

Use Conventional Commit titles. The release workflow runs release-please on `main`; merging its Release PR tags the package and publishes it to npm through npm Trusted Publishing (OIDC). Configure npm with trusted publisher values:

- owner: `fransiscuss`
- repository: `ampeco-node`
- workflow: `release.yml`
- environment: `npm`

No `NPM_TOKEN` is stored in GitHub.

## Security

Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/fransiscuss/ampeco-node/security/advisories/new). See [SECURITY.md](SECURITY.md) for how to handle API tokens.

## License

MIT. Built and maintained by [Fransiscus Setiawan](https://fransiscuss.com).
