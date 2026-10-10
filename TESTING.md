# Testing

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Current unit coverage targets the most sensitive pure logic: subscription quality/stream enforcement, payment provider isolation, and safe page-builder sections.

CI should add PostgreSQL integration tests for authentication and idempotent webhooks, API authorization tests, FFmpeg fixtures, Playwright responsive/accessibility checks, and provider sandbox contract tests.

P2P Lab unit coverage uses mocked browser/network behavior and self-contained metadata. Manual P2P testing must use a small self-created or explicitly licensed video; see `P2P_LAB.md`.
