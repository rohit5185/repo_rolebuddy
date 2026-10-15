# RoleBuddy Phase 1 Documentation (General Project Documentation)

Last updated: 2026-04-23
Document owner: RoleBuddy team
Project codename in research artifacts: RoleSync (same product direction)

## 1. Purpose and Scope
This document is the Phase 1 baseline for RoleBuddy. It consolidates:
- Product direction from the research phase
- Current implemented system (frontend, backend, API, realtime, data model)
- Architecture and engineering decisions
- Risks, gaps, and next-phase recommendations

This document is intended for onboarding, development continuity, product alignment, and technical review.

## 2. Product Overview
RoleBuddy is a role-based peer accountability platform for job preparation.

Core value proposition:
- Not only matching users for role prep
- Ensuring consistency through daily check-ins, streaks, partner visibility, and continued engagement

Primary use case:
- A user preparing for a role (for example, frontend/backend) signs up, completes onboarding, gets matched, chats with a partner, and tracks consistency.

## 3. Phase 1 Objectives
Phase 1 focused on establishing the functional core:
- Auth and session flow
- Structured onboarding
- Role/experience-based matching with fallback logic
- Dashboard with accountability metrics
- Peer connection/discovery
- Realtime + API chat foundation
- Basic safety and validation at service layer

## 4. Research Phase Synthesis (from provided PDF)
Key findings captured and carried into Phase 1:
- Problem: job preparation is often isolated, unstructured, and inconsistent.
- Market gap: existing platforms solve fragments (networking, content, community) but not a complete accountability system.
- MVP priorities: signup/login, role capture, matching, chat, accountability-oriented behavior loops.
- Strategic insight: product success depends more on retention behavior (daily action) than feature breadth.
- Scope control: avoid over-building early (heavy AI, complex analytics, broad feature spread).

Research-to-build alignment in current code:
- Implemented: auth, onboarding, matching, chat, discovery, connection requests, dashboard, daily check-in support in chat.
- Partially implemented: trust/safety, deep retention systems, explicit success metrics instrumentation.
- Not implemented (planned/future): advanced gamification, AI suggestions, advanced analytics, verification workflows.

## 5. System Context and High-Level Architecture
Architecture style:
- Frontend: Next.js app router (React)
- Backend: Node.js + Express + Mongoose
- Database: MongoDB
- Realtime: Socket.IO
- Auth: JWT (cookie + bearer fallback)

High-level flow:
1. Frontend sends API requests to backend (`/api/*`) with credentials.
2. Backend validates JWT, processes feature logic, persists to MongoDB.
3. Chat uses both REST and Socket.IO for messaging and seen-state updates.
4. Dashboard and matching derive from user profile, activity, and relationship state.

## 6. Repository Structure
Top-level:
- `backend/` Express + MongoDB + Socket.IO service
- `frontend/` Next.js client app
- `docs/` project documentation (this file)
- `RoleBuddy- Research Phase Documentation.pdf` source research input

Backend source tree:
```text
backend/src
|-- app.js
|-- server.js
|-- config/
|   |-- db.js
|   `-- env.js
|-- features/
|   |-- activity/
|   |-- auth/
|   |-- chat/
|   |-- connection/
|   |-- discovery/
|   |-- match/
|   `-- user/
|-- middlewares/
|   |-- auth.middleware.js
|   `-- errorHandler.js
`-- utils/
    |-- apiResponse.js
    |-- appError.js
    `-- asyncHandler.js
```

Frontend source tree (core):
```text
frontend/app
|-- page.tsx -> redirects to /login
|-- layout.tsx
|-- globals.css
|-- login/page.tsx
|-- signup/page.tsx
|-- onboarding/page.tsx
|-- dashboard/page.tsx
|-- discovery/page.tsx
`-- chat/page.tsx

frontend/features
|-- auth/
|-- onboarding/
|-- matching/
|-- dashboard/
|-- discovery/
|-- connection/
`-- chat/
```

## 7. User Journey Implemented in Phase 1
1. User lands on app and is redirected to `/login`.
2. User signs up/logs in.
3. User completes onboarding (domain/role/experience/goals/availability/etc.).
4. User opens dashboard and optionally finds a match.
5. User can discover users, send/accept/reject connection requests.
6. User can create/join conversation with matched or connected users.
7. User sends messages and check-in responses; partner visibility and streak data feed accountability loop.

## 8. Frontend Routes
- `/` -> redirects to `/login`
- `/login` -> login UI
- `/signup` -> signup UI
- `/onboarding` -> onboarding flow
- `/dashboard` -> dashboard and match trigger
- `/discovery` -> connection discovery/search/suggestions
- `/chat` -> conversation and realtime chat

## 9. Backend API Surface
Base URL: `http://localhost:5000/api` (default)
Health check: `GET /health`

Authentication:
- JWT cookie name: `accessToken`
- Also supports `Authorization: Bearer <token>`

### 9.1 Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`

### 9.2 User
- `GET /api/user/profile` (auth)
- `PUT /api/user/onboarding` (auth)
- `GET /api/user/dashboard` (auth)

### 9.3 Matching
Mounted at both `/api/match` and `/api/matches`:
- `POST /api/match/find` (auth)
- `POST /api/matches/find` (auth alias)

### 9.4 Discovery
- `GET /api/discovery/roles?q=<query>` (auth)
- `GET /api/discovery/role/:roleName` (auth)

### 9.5 Connection
- `POST /api/connection/display-name` (auth)
- `POST /api/connection/request` (auth)
- `POST /api/connection/request/accept` (auth)
- `POST /api/connection/request/reject` (auth)
- `GET /api/connection/requests` (auth)
- `GET /api/connection/list` (auth)
- `GET /api/connection/suggestions?limit=10` (auth)
- `GET /api/connection/search?q=<query>&limit=20` (auth)
- `GET /api/connection/profile/:userId` (auth)

### 9.6 Chat
Chat router is mounted at both `/api` and `/api/chats`:
- `GET /api/` (readiness message)
- `GET /api/conversations` (auth)
- `POST /api/conversations` (auth)
- `GET /api/messages/:conversationId?page=1&limit=20` (auth)
- `POST /api/messages` (auth)
- `POST /api/messages/:messageId/seen` (auth)

Equivalent alias paths exist under `/api/chats/*`.

### 9.7 Response and Error Conventions
Success responses generally follow:
- `{ message: string, data: object }`

Error handler returns:
- `{ message: string }`
- Includes stack in development mode.

## 10. Realtime (Socket.IO) Contract
Server setup:
- Socket auth via handshake token/header/cookie.
- User room: `user:<userId>`
- Conversation room: `conversation:<conversationId>`

Client events:
- `join_conversation` (payload may include `partnerId`)
- `send_message` (conversation/message payload)
- `mark_seen` (`messageId`)

Server emits:
- `receive_message`
- `mark_seen`

## 11. Data Model (MongoDB via Mongoose)

### 11.1 User collection (`User`)
Core fields:
- Identity: `email` (unique), `password`
- Profile/onboarding: `domain`, `domainArea`, `primaryArea`, `area`, `specialization`, `role`, `experience`, `skills`, `intent`, `goal`, `dailyGoal`, `availabilityFrequency`, `availabilityTime`, `availability`, `preferences`, `onboardingCompleted`
- Activity/accountability: `lastActiveAt`, `lastCheckInDate`, `streakCount`, `checkInHistory[]`
- Matching: `status` (`waiting|matched`), `matchedUserId`
- Social: `displayName` (unique sparse), `connections[]`, `connectionRequests[]`
- Metadata: `createdAt` (timestamps enabled), `updatedAt` disabled

Indexes:
- `role`
- `domainArea`
- `status`
- `lastActiveAt`
- Compound: `role + status + lastActiveAt`
- Compound for requests:
  - `connectionRequests.from + connectionRequests.to`
  - `connectionRequests.from + connectionRequests.to + connectionRequests.status`

### 11.2 Conversation collection (`Conversation`)
- `participants` (exactly 2 users)
- `participantsKey` (unique sorted key)
- `lastMessage`
- `isActive`
- `createdAt`, `updatedAt`

Indexes:
- `participants`
- `updatedAt`

### 11.3 Message collection (`Message`)
- `conversationId`
- `senderId`
- `type` (`text|checkin|system|reminder|alert`)
- `content`
- `metadata`
- `seenBy[]`
- `createdAt`, `updatedAt`

Indexes:
- `conversationId + createdAt`
- `conversationId + senderId + createdAt`

## 12. Matching Logic (Implemented)
Selection strategy:
- Candidate must be onboarding-complete, active in recent window (24h), not self.
- Prefer same domain when candidates exist.
- Hierarchical scoring/relaxation:
  - Role + experience (100)
  - Role (90)
  - Specialization + experience (80)
  - Specialization (70)
  - Domain area + experience (60)
  - Domain area (50)
- If no hierarchical match found, fallback candidate score is 40.
- Existing matched state is reused when valid.

## 13. Accountability and Activity Mechanics
- `updateLastActive()` updates heartbeat-like activity state.
- Check-in responses tracked through `recordCheckIn(status)` with duplicate prevention per day.
- Streak increments only for valid consecutive `done` outcomes.
- Daily check-in prompt message can be system-generated in conversation.
- `not_done` check-in can generate partner alert message.

## 14. Security and Validation Snapshot
Current implemented controls:
- JWT auth middleware on protected routes
- HttpOnly cookie with env-based secure/sameSite settings
- Service-level payload normalization and validation
- Regex and length constraints on key onboarding/discovery inputs
- Duplicate handling for connection requests and chat idempotency scenarios

Open security hardening for next phase:
- Rate limiting
- Brute-force protection for auth
- Enhanced trust/safety and moderation controls
- Structured audit logs

## 15. Configuration and Environment
Backend env variables:
- Required: `MONGO_URI`, `JWT_SECRET`
- Optional/common: `PORT` (default 5000), `CLIENT_ORIGIN` (default `http://localhost:3000`), `JWT_EXPIRES_IN` (default `7d`), `JWT_COOKIE_MAX_AGE_MS`

Frontend env variables:
- `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:5000/api`)

## 16. Local Development and Scripts
Backend:
- `npm run dev`
- `npm run start`
- Smoke checks:
  - `npm run auth:smoke`
  - `npm run onboarding:smoke`
  - `npm run matching:smoke`
  - `npm run domain-area:smoke`
  - `npm run chat:smoke`
  - `npm run activity:smoke`
  - `npm run dashboard:smoke`
  - `npm run discovery:smoke`
  - `npm run connection:smoke`

Frontend:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- Checks:
  - `npm run auth:check`
  - `npm run onboarding:check`

## 17. Known Gaps and Risks (Phase 1)
- API response contract consistency should be standardized across all features.
- Connection and matching logic should be load-tested for concurrency and scale.
- No explicit observability stack (metrics/traces/log aggregation) yet.
- Trust and safety controls are basic compared to product ambition.
- Documentation can be split further by audience (tutorial/how-to/reference/explanation).

## 18. Phase 2 Recommended Priorities
1. Stabilize API contracts with OpenAPI spec and generated docs.
2. Add observability, error taxonomy, and operational dashboards.
3. Add trust/safety foundations (reporting, moderation actions, abuse protections).
4. Improve retention mechanics (notifications, richer accountability cycles).
5. Add ADR log for critical architecture decisions.
6. Split docs into Diataxis-aligned sections and keep this file as phase baseline.

## 19. Documentation Standard Used for This File
This documentation follows a hybrid approach:
- Structure inspired by arc42 (architecture communication sections)
- Content separation direction aligned to Diataxis (tutorial/how-to/reference/explanation)
- Architecture visualization guidance aligned to C4 model levels
- API specification direction aligned to OpenAPI
- Decision history recommendation aligned to ADR practice

## 20. Source References (Industry Documentation Approaches)
- Diataxis framework: https://diataxis.fr/
- arc42 template overview: https://arc42.org/overview
- C4 model: https://c4model.com/
- OpenAPI specification index: https://spec.openapis.org/oas/
- ADR guidance hub: https://adr.github.io/

## 21. Appendix A: Core Domain Summary
Core entities and relationships:
- User can be matched to one partner (`matchedUserId`).
- User can have many social connections (`connections`).
- User can have many incoming requests (`connectionRequests`).
- Conversation has exactly two participants.
- Conversation has many messages.
- Messages can represent text, check-ins, and alerts.

## 22. Appendix B: Phase 1 Definition of Done (Current State)
Completed in code:
- Authentication and user profile bootstrap
- Onboarding storage and validation
- Matching engine with fallback logic
- Dashboard with streak/check-in state
- Discovery and connection request flow
- Realtime-enabled chat foundation
- Core database schemas and indexes

Partially complete:
- Product analytics and business KPI instrumentation
- Operational hardening and trust/safety depth
- Formalized API contract publication and versioning
