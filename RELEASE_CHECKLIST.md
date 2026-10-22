# ORUN release checklist

- [ ] Production runtime variables and bindings pass `/api/health/readiness`.
- [ ] Database migrations were rehearsed on production-like data.
- [ ] A current isolated backup restore completed successfully.
- [ ] The rollback exercise restored the previous application version safely.
- [ ] Critical authentication, catalogue, playback, commerce and admin E2E journeys pass.
- [ ] Security assessment and dependency review pass.
- [ ] Load test meets agreed latency, error-rate and saturation thresholds.
- [ ] Logs, metrics, traces and routed alerts were verified.
- [ ] On-call ownership, incident contacts, RPO and RTO are documented.
- [ ] The readiness API records a passing decision for the exact release version.

Evidence belongs in an immutable external system; ORUN stores only references and outcomes. A missing, failed or expired check blocks approval.
