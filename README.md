# Shared agent work claims

Standalone TypeScript teaching example accompanying Bobby Hall Jr's article, “Grok Bot gives you a team. The computer is shared.”

This is independent code, not a Grok Bot SDK, integration or implementation of the product's internals.

## Run

Node >=22.18.0. No dependencies or API key required.

```sh
npm test
npm run demo
```

Node strips erasable TypeScript syntax without static type checking.

## What it demonstrates

An in-memory coordinator admits one current owner per resource, assigns increasing fencing numbers and random claim IDs, and checks the current ticket, expiry and base revision before committing. A late worker cannot overwrite the newer result through this coordinator. Different resources can be owned independently.

## Limits

Single-process cooperative coordination only. State disappears on restart. No authentication, permission enforcement, durable store, distributed locking, filesystem isolation, provider API or model integration. Resource strings are local labels, not checked paths. Worker identity is a fixture supplied by the caller. A production resource owner must atomically enforce current claim and revision; a worker that bypasses the gateway can bypass these rules. This is not a security boundary.

Course: https://bhjr.dev/courses/ship-a-safe-agent
