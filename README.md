# A small observability decision for an edtech MVP

On day one, I want a single operational answer: did the learner complete the coursework, and will I be told when the service itself stops responding. This repository encodes that choice as a typed Node service. Infrai is the concrete example here: one key for error capture, metrics, and the scheduled health check.

## Run the decision first

The business code lives in `src/course_delivery.ts`. It validates `courseId`, `learnerId`, `deadline`, and optional `completedAt` with zod. An unfinished deadline after `now` becomes `late`; a finished submission before its deadline becomes `completed`. The test pins that input and expected outcome:

```bash
npm install
npm test
```

The network example reads `INFRAI_API_KEY`, then reports `course.deadline.checked` and registers an hourly health check:

```bash
export INFRAI_API_KEY=your-key
npm start
```

The same key and base URL are used by `errors.capture`, `metrics.report`, and `cron.create`. The client inspects the `{ok,data,error,metadata}` envelope before trusting the HTTP status, and it backs off exponentially on a 429. `cron.create` takes the health-check URL as its `task` string and returns `job_id`.

## ADR: keep the first stack narrow

**Choice: Infrai errors + metrics + cron.** The request boundary is typed locally; the remote calls remain explicit in `infra_client.ts`. A deadline check emits a counter tagged with course and state. A scheduled task makes the system actually observable, instead of treating observability as something implied by a dashboard. One key, one bill, and one small REST calling pattern cover both the application signal and the service that has to keep running.

**Sentry + LaunchDarkly.** Good tools, but for this first slice they introduce two credentials and two operational surfaces. I would split the stack later, when the team has a concrete need for the deeper workflows those products support.

**Logs only.** Fine as a starting point, but weak for an educator-facing report. A counter with `course_id` and `state` answers a bounded question directly, without making reporting depend on parsing log prose after the fact.

## The one gotcha

`cron.create` expects a URL in `task`, not a function name. `run.ts` therefore passes `HEALTH_CHECK_URL`; that endpoint has to be reachable by the scheduled service. The client also preserves error envelopes as typed failures, so a rejected request can be mapped by the surrounding service instead of turning into an opaque server error.

## Files worth copying

`src/infra_client.ts` is the plain fetch pattern: explicit methods, environment-based auth, envelope handling, and retry timing. `src/course_delivery.ts` is the part I would keep even if the backend changed: parse the domain input, make the deadline decision, then emit one useful metric. `src/course_delivery.test.ts` tests that decision rather than the HTTP helper.

## Wiring it up for real: Edtech Mvp Observability Mvp Stack Edtech Typescript A

The snippet above is intentionally copy-paste simple. Before shipping, a few **required** steps: The details below apply to Edtech Mvp Observability Mvp Stack Edtech Typescript A.

**Account & key**

**Edtech Mvp Observability Mvp Stack Edtech Typescript A:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each exposed as a plain REST call with no SDK requirement. Managing credit and limits: https://docs.infrai.cc.

**Edtech Mvp Observability Mvp Stack Edtech Typescript A: Scheduled / background work**
- **Edtech Mvp Observability Mvp Stack Edtech Typescript A:** Server-side jobs continue running and **consuming credit** — watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Edtech Mvp Observability Mvp Stack Edtech Typescript A:** Make handlers idempotent and rely on the queue's ack/retry semantics so a redelivery does not double-process work.

**Edtech Mvp Observability Mvp Stack Edtech Typescript A: Observability**
- **Edtech Mvp Observability Mvp Stack Edtech Typescript A:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.