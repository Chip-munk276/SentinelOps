# Data contracts (DRAFT — agree on Day 2, then mark AGREED)

These are the only places Prarthana's part and Akanksha's part touch.
Until both sides are ready, each person builds against fake data in these formats.
Times are ISO 8601 UTC, e.g. `2026-11-10T12:04:31Z`.

JSON field names and enum values are case-sensitive.

## 1. Log event — services → Cassandra (Prarthana writes, everyone reads)
```json
{"event_id": "log-0001", "service_id": "payments", "timestamp": "2026-11-10T12:04:31Z",
  "level": "ERROR", "message": "Charge failed: upstream timeout" }
```
Field definitions:

-   `event_id`: unique identifier for this log event.
-   `service_id`: `login` \| `orders` \| `payments`.
-   `timestamp`: time the event occurred, in UTC.
-   `level`: `INFO` \| `WARN` \| `ERROR`.
-   `message`: human-readable log message.

`event_id` should be unique. Logs are append-only events; a later
recovery should be recorded as a new event rather than overwriting the
original failure.

## 2. Metric sample — every 1 s per service
**Owner:** Prarthana. Used by the anomaly detector and dashboard.

```json
{ "service_id": "payments", "timestamp": "2026-11-10T12:04:31Z",
  "error_rate": 0.40, "latency_ms": 820, "request_count": 112 }
```
Field definitions:

-   `timestamp`: end of the measurement window, in UTC.
-   `error_rate`: failed requests divided by total requests in the
    window, represented as a decimal from `0.0` to `1.0`.
-   `latency_ms`: average response latency in milliseconds during the
    measurement window.
-   `request_count`: total requests observed during that window.

The measurement window is the preceding one-second interval. If no
requests were observed, `request_count` is `0` and `error_rate` and
`latency_ms` are `null`, because they cannot be calculated from requests
that do not exist.

## 3. Anomaly alert — detector → agent (Prarthana → Akanksha)
**Owner:** Prarthana produces the alert; Akanksha consumes it.

```json
{ "alert_id": "a-0042", "service_id": "payments", "metric": "error_rate",
  "value": 0.40, "baseline": 0.01, "severity": "HIGH", "started_at": "2026-11-10T12:05:02Z",
  "recent_events": [
    { "type": "deploy", "service_id": "payments", "version": "v1.4.2",
      "timestamp": "2026-11-10T12:04:00Z" }
  ] }
```
Field definitions:

-   `alert_id`: unique identifier for this alert.
-   `service_id`: affected service.
-   `metric`: `error_rate` \| `latency_ms` \| `down`.
-   `value`: observed metric value. For `error_rate`, use a decimal from
    `0.0` to `1.0`; for `latency_ms`, use milliseconds. For `down`, use
    a boolean.
-   `baseline`: expected metric value in the same units as `value`. For
    `down`, use `null`.
-   `severity`: `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL`.
-   `started_at`: time the detector first identified this anomaly.
-   `recent_events`: zero or more relevant events from the preceding
    five minutes. The list may be empty.

Each recent event has:

-   `type`: `deploy` \| `restart` \| `chaos`.
-   `service_id`: affected service.
-   `timestamp`: event time in UTC.
-   `version`: deployment version, when applicable; otherwise `null` or
    omitted.

The agent may use this alert to retrieve additional logs and metrics for
the affected service and time window. An alert is evidence of an
anomaly, not proof of its root cause.

For `down`, the detector reports a boolean `value` and a `null`
`baseline`. No numeric comparison is performed for this metric.

## 4. Agent decision — agent → remediation (Akanksha → Prarthana)
**Owner: ** Akanksha produces the decision; Prarthana validates and executes any permitted remediation action.

```json
{ "alert_id": "a-0042", "service_id": "payments", "action": "rollback",
  "target_version": "v1.4.1", "confidence": 0.91, "needs_approval": true,
  "root_cause": "Deploy v1.4.2 at 12:04 introduced payment errors",
  "matched_incident": "INC-012",
  "explanation": "Errors began 62 s after deploy v1.4.2; matches INC-012. Rolling back." }
```
Field definitions:

-   `action`: `rollback` \| `restart`.
-   `target_version`: required for `rollback`; use `null` for `restart`.
-   `confidence`: number from `0.0` to `1.0` representing the agent's
    estimated confidence in its diagnosis, not a guaranteed probability.
-   `needs_approval`: whether human approval is required before
    executing the proposed action.
-   `root_cause`: best-supported diagnosis, expressed as a hypothesis
    when the available evidence is insufficient for confirmation.
-   `matched_incident`: ID of the most relevant historical incident, or
    `null` when no suitable incident is found.
-   `explanation`: concise explanation referencing available evidence.

### Approval policy

-   By default, `needs_approval` is `true` for all proposed actions.
-   An action may execute automatically only if the team has explicitly
    configured that action as safe for automatic execution and the
    confidence is at least `0.70`.
-   If confidence is below `0.70`, approval is always required.
-   The remediation component must validate the action, target version,
    service ID, and approval policy before executing anything.
-   A diagnosis or recommendation alone must never be treated as proof
    that remediation has occurred.

The diagnosis agent does not directly restart services or perform
rollbacks. It returns a structured decision for the remediation
component to validate.

## 5. Remediation result --- remediation → backend and dashboard
**Owner:** Prarthana.

``` json
{
  "alert_id": "a-0042",
  "service_id": "payments",
  "action": "rollback",
  "status": "success",
  "target_version": "v1.4.1",
  "message": "Rollback completed; health checks passed.",
  "timestamp": "2026-11-10T12:05:30Z"
}
```

Field definitions:

-   `action`: `rollback` \| `restart`.
-   `status`: `pending_approval` \| `started` \| `success` \| `failed`.
-   `target_version`: target version for a rollback; `null` for a
    restart.
-   `message`: human-readable outcome or failure reason.
-   `timestamp`: time this result was recorded.

The result must reflect the actual action outcome. Report `success` only
after the operation completes and the relevant health check passes. A
failed action must return `failed` with a useful message.

## 6. Dashboard event — backend → dashboard over WebSocket `/ws`
**Owner:** Prarthana produces events; Akanksha consumes them.

Every event has a `type` field and a UTC timestamp in `time`.

### 6.1 Status event

``` json
{
  "type": "status",
  "service_id": "payments",
  "status": "red",
  "message": "Error rate reached 40%",
  "time": "2026-11-10T12:05:02Z"
}
```

-   `status`: `green` \| `amber` \| `red`.
-   `message`: short health summary.

### 6.2 Log event

``` json
{
  "type": "log",
  "service_id": "payments",
  "level": "ERROR",
  "message": "Charge failed: upstream timeout",
  "time": "2026-11-10T12:04:31Z"
}
```

-   `level`: `INFO` \| `WARN` \| `ERROR`.

### 6.3 Agent step event

``` json
{
  "type": "agent_step",
  "alert_id": "a-0042",
  "service_id": "payments",
  "step": "historical_search",
  "message": "Found a similar past incident: INC-012",
  "time": "2026-11-10T12:05:10Z"
}
```

-   `step`: short identifier for the current investigation step.
-   `message`: concise summary of the step or evidence.
-   Do not expose private credentials, secrets, or hidden internal model
    reasoning. Show useful investigation summaries and evidence.

### 6.4 Action event

``` json
{
  "type": "action",
  "alert_id": "a-0042",
  "service_id": "payments",
  "action": "rollback",
  "status": "pending_approval",
  "message": "Rollback requires approval.",
  "time": "2026-11-10T12:05:15Z"
}
```

-   `action`: `rollback` \| `restart`.
-   `status`: one of the remediation statuses defined in section 5.

### 6.5 Recovered event

``` json
{
  "type": "recovered",
  "alert_id": "a-0042",
  "service_id": "payments",
  "status": "green",
  "message": "Health checks passed after remediation.",
  "time": "2026-11-10T12:05:30Z"
}
```

The `recovered` event is emitted only after the service passes its
health checks. It indicates recovery, not merely that an action was
requested.

### WebSocket rules

-   Each message is one JSON event.
-   Events are pushed when they occur; clients must not assume every
    event will be received during a disconnect.
-   The dashboard should reconnect after a disconnect and refresh
    current service and incident state through the backend.
-   Protect the WebSocket endpoint from unauthorized access if
    authentication is enabled.

## 7. Chaos endpoint — dashboard → services (Prarthana provides)
**Owner:** Prarthana.

`POST /chaos/{service_id}/{failure}` where `failure` is `crash` | `bad_deploy` | `flood`
Example request:

`POST /chaos/orders/bad_deploy`

Accepted response:

``` json
{
  "ok": true,
  "status": "accepted",
  "service_id": "orders",
  "failure": "bad_deploy",
  "injected_at": "2026-11-10T12:04:00Z"
}
```

`ok: true` with status `accepted` means the request was accepted, not
necessarily that the failure has already taken effect.

The backend must validate service and failure values. Invalid requests
return an appropriate HTTP 4xx response with a JSON error message.
Failed injections must not be reported as successful.

Provide a recovery/reset endpoint for the demo, for example:

`POST /chaos/{service_id}/recover`

The recovery endpoint must use the same service validation and return a
clear success or failure response. Recovery is confirmed only after the
service is healthy again.

Chaos controls must be restricted to the isolated demo environment.

## 8. Past incident — knowledge base (Akanksha)
```json
{ "incident_id": "INC-012", "service_id": "payments", "failure_type": "bad_deploy",
  "symptoms": "Error rate jumped to 35% within a minute of a deploy",
  "root_cause": "Bad config in new release", "fix": "rollback",
  "recovery_time_s": 45 }
```
Field definitions:

-   `incident_id`: unique incident identifier.
-   `service_id`: `login` \| `orders` \| `payments`.
-   `failure_type`: `crash` \| `bad_deploy` \| `flood` \| `other`.
-   `symptoms`: description of observed symptoms.
-   `root_cause`: verified cause where known; otherwise explicitly mark
    it as unconfirmed.
-   `fix`: resolution that worked.
-   `recovery_time_s`: recovery duration in seconds, or `null` if
    unknown.

Knowledge-base search accepts a new incident description and returns
zero or more matching incidents with their incident IDs and details. A
similarity score may also be returned if the vector-search
implementation provides one.

A historical match is supporting evidence, not proof that the new
incident has the same cause.

## Component communication

For the initial demo:

1.  Services send logs and metrics to the ingestion/storage pipeline.
2.  The detector creates an alert when an anomaly is identified.
3.  The alert is passed to the diagnosis agent.
4.  The agent returns a decision to the remediation component.
5.  Remediation validates and executes permitted actions.
6.  The backend publishes dashboard events over `/ws`.
7.  The dashboard calls the chaos and recovery endpoints.

## Folder ownership
| Folder | Owner |
| --- | --- |
| services/, ingestion/, detector/, remediation/, docker-compose.yml | Prarthana |
| agent/, knowledge_base/, dashboard/ | Akanksha |
