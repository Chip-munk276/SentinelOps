# Data contracts (DRAFT — agree on Day 2, then mark AGREED)

These are the only places Prarthana's part and Akanksha's part touch.
Until both sides are ready, each person builds against fake data in these formats.
Times are ISO 8601 UTC, e.g. `2026-11-10T12:04:31Z`.

## 1. Log event — services → Cassandra (Prarthana writes, everyone reads)
```json
{ "service_id": "payments", "timestamp": "2026-11-10T12:04:31Z",
  "level": "ERROR", "message": "Charge failed: upstream timeout" }
```
`service_id`: `login` | `orders` | `payments` · `level`: `INFO` | `WARN` | `ERROR`

## 2. Metric sample — every 1 s per service
```json
{ "service_id": "payments", "timestamp": "2026-11-10T12:04:31Z",
  "error_rate": 0.40, "latency_ms": 820, "request_count": 112 }
```

## 3. Anomaly alert — detector → agent (Prarthana → Akanksha)
```json
{ "alert_id": "a-0042", "service_id": "payments", "metric": "error_rate",
  "value": 0.40, "baseline": 0.01, "started_at": "2026-11-10T12:05:02Z",
  "recent_events": [
    { "type": "deploy", "service_id": "payments", "version": "v1.4.2",
      "timestamp": "2026-11-10T12:04:00Z" }
  ] }
```
`metric`: `error_rate` | `latency_ms` | `down` · event `type`: `deploy` | `restart` | `chaos`

## 4. Agent decision — agent → remediation (Akanksha → Prarthana)
```json
{ "alert_id": "a-0042", "service_id": "payments", "action": "rollback",
  "target_version": "v1.4.1", "confidence": 0.91, "needs_approval": false,
  "root_cause": "Deploy v1.4.2 at 12:04 introduced payment errors",
  "matched_incident": "INC-012",
  "explanation": "Errors began 62 s after deploy v1.4.2; matches INC-012. Rolling back." }
```
`action`: `rollback` | `restart` only · `needs_approval` is true when `confidence` < 0.7

## 5. Dashboard event — backend → dashboard over WebSocket `/ws`
```json
{ "type": "status", "service_id": "payments", "status": "red",
  "message": "Error rate 40%", "time": "2026-11-10T12:05:02Z" }
```
`type`: `status` | `log` | `agent_step` | `action` | `recovered`
`status` (only for `type: status`): `green` | `amber` | `red`

## 6. Chaos endpoint — dashboard → services (Prarthana provides)
`POST /chaos/{service_id}/{failure}` where `failure` is `crash` | `bad_deploy` | `flood`
Response: `{ "ok": true, "injected_at": "2026-11-10T12:04:00Z" }`

## 7. Past incident — knowledge base (Akanksha)
```json
{ "incident_id": "INC-012", "service_id": "payments", "failure_type": "bad_deploy",
  "symptoms": "Error rate jumped to 35% within a minute of a deploy",
  "root_cause": "Bad config in new release", "fix": "rollback",
  "recovery_time_s": 45 }
```

## Folder ownership
| Folder | Owner |
| --- | --- |
| services/, ingestion/, detector/, remediation/, docker-compose.yml | Prarthana |
| agent/, knowledge_base/, dashboard/ | Akanksha |
