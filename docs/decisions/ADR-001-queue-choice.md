# ADR-001: Redis + BullMQ for Job Queue

## Status
Accepted

## Context
Assignment requires batch processing, horizontal scaling, scheduling, and a queuing system. In-process async cannot meet these needs reliably.

## Decision
Use **Redis + BullMQ** for the bulk action job queue, delayed/scheduled jobs, retries, and rate-limit counters.

## Consequences
- Pros: scheduling, retries, concurrency, multi-worker scale, rate limiting keys
- Cons: requires Redis (handled via Docker Compose)

## Related
- [[02-Tech-Stack]]
- [[01-Architecture-Plan]]
- [[09-AGENT-HANDOFF]]
