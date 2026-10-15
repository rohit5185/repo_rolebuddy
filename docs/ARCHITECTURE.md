# Architecture - RoleBuddy

Last updated: 2026-04-23

## 1. Architecture Summary
RoleBuddy uses a web app + API service architecture with MongoDB persistence and Socket.IO for realtime chat.

Core design goals in Phase 1:
- Fast product iteration
- Clear feature modularity in backend
- Stable onboarding -> matching -> engagement flow
- Realtime interaction for accountability support

## 2. System Context
Primary actors:
- End user (job preparation user)
- RoleBuddy frontend
- RoleBuddy backend API
- MongoDB

High-level interaction:
1. User interacts with frontend pages.
2. Frontend calls backend REST API with cookie/bearer auth.
3. Backend reads/writes MongoDB and returns structured responses.
4. Chat uses Socket.IO events for low-latency messaging and seen updates.

## 3. Container View

### Frontend (`frontend/`)
- Next.js App Router
- Feature-based organization (`features/*`)
- Shared API client in `services/api.ts`
- Routing entry points in `app/*`

### Backend (`backend/`)
- Express app with feature routers
- Mongoose data layer and schemas
- JWT middleware for protected routes
- Socket.IO server attached to HTTP server

### Data Store
- MongoDB with collections:
  - `users`
  - `conversations`
  - `messages`

## 4. Backend Module Decomposition
Feature modules under `backend/src/features/`:
- `auth`: signup/login and cookie issuance
- `user`: profile, onboarding update, dashboard snapshot
- `match`: candidate retrieval and scoring-based assignment
- `discovery`: role aggregates and role-specific samples
- `connection`: display names, requests, social graph actions
- `chat`: conversations, messages, check-ins, seen state, realtime emission
- `activity`: last-active updates and streak/check-in logic

Cross-cutting modules:
- `middlewares/auth.middleware.js`: JWT verification
- `middlewares/errorHandler.js`: centralized error response
- `utils/appError.js`: operational error type
- `config/env.js`: env validation and parsing
- `config/db.js`: Mongo connection bootstrap

## 5. Request Lifecycle
1. Request enters Express app.
2. CORS, JSON parser, cookies are processed.
3. Route-level auth middleware validates token (if protected).
4. Controller delegates business logic to service.
5. Service executes validation + Mongo operations.
6. Response returned with `{ message, data }` pattern.
7. Any thrown error is formatted by global error handler.

## 6. Authentication Model
- Token type: JWT
- Token subject: user id (`sub`)
- Delivery:
  - HttpOnly cookie `accessToken`
  - Bearer token fallback for API auth only
- Cookie behavior:
  - `secure=true` and `sameSite=none` in production
  - `sameSite=lax` in development

## 7. Matching Architecture
Matching service performs:
- User eligibility checks (onboarding completion)
- Activity-window candidate filtering
- Domain preference (same domain when available)
- Hierarchical score-based relaxation
- Assignment with optimistic conflict handling

Outcome types:
- Existing match reused
- New partner assigned
- No candidate / assignment conflict error

## 8. Realtime Architecture
Socket.IO runs on backend HTTP server.

Auth flow:
- Token extracted from cookie, then authorization header.
- User identity attached to socket context.

Room model:
- User room: `user:<userId>`
- Conversation room: `conversation:<conversationId>`

Main events:
- Client -> server: `join_conversation`, `send_message`, `mark_seen`
- Server -> clients: `receive_message`, `mark_seen`

## 9. Data Consistency Choices
- Duplicate prevention exists in several high-value paths:
  - Connection request idempotency checks
  - Check-in duplicate response guards
  - Message duplicate checks using payload characteristics
- Match assignment includes re-check logic to reduce race-condition impact.

## 10. Key Constraints and Trade-offs
Chosen in Phase 1:
- Fast iteration over strict API contract governance
- Embedded social/request arrays in `User` model for speed of implementation
- Combined REST + Socket paths for chat reliability

Deferred to later phases:
- OpenAPI-first contract generation
- Formal event versioning
- Observability standards (metrics, traces, structured logs)
- Rich trust and moderation architecture

## 11. Deployment and Runtime (Current)
Expected local runtime:
- Backend on `:5000`
- Frontend on `:3000`
- MongoDB reachable via `MONGO_URI`

Health endpoint:
- `GET /health`

## 12. Architecture Risks (Current)
- Response contract variations across modules may increase client complexity.
- Social graph embedded model may become harder to scale with large request volume.
- Global API rate limiting (`express-rate-limit` on `/api/*`); tune via `RATE_LIMIT_*` env vars.
- Realtime reliability under high concurrency not load-tested.

## 13. Recommended Next Architecture Steps
1. Publish OpenAPI specification for REST endpoints.
2. Add centralized request/response schema validation strategy.
3. Introduce observability baseline (request ids, metrics, tracing hooks).
4. Add architecture decision log (`docs/adr/`).
5. Prepare scaling plan for connection/request data growth.
