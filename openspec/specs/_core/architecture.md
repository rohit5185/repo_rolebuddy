# Architecture — RoleBuddy

> Extracted from actual code. Documents current implementation only.

---

## System Overview

RoleBuddy is a structured peer accountability system for job preparation.
Core idea: match users preparing for the **same role** so they can hold each other accountable.

---

## Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Node.js + Express 4.x (ES Modules)     |
| Database  | MongoDB via Mongoose 8.x               |
| Auth      | JWT (HttpOnly cookie + Bearer header)  |
| Realtime  | Socket.IO 4.x                          |
| Frontend  | Next.js (App Router) + TypeScript      |
| Styling   | Tailwind CSS                           |

---

## Backend File Structure

```
backend/src/
├── app.js                    ← Express app setup, routes mounted
├── server.js                 ← HTTP server, DB connect, Socket.IO init, bootstrap
├── config/
│   ├── db.js                 ← connectDatabase()
│   └── env.js                ← typed env vars
├── middlewares/
│   ├── auth.middleware.js    ← verifyJwt (cookie + Bearer header)
│   └── errorHandler.js       ← global error handler → { message, stack? }
├── utils/
│   ├── asyncHandler.js       ← wraps async route handlers
│   └── appError.js           ← AppError class (message, statusCode)
└── features/
    ├── auth/                 ← signup, login, User model
    ├── user/                 ← profile, onboarding, dashboard
    ├── match/                ← hierarchical matching engine
    ├── discovery/            ← role aggregation, role detail
    ├── connection/           ← display name, requests, connections, search
    ├── chat/                 ← conversations, messages, Socket.IO
    └── activity/             ← lastActive update, check-in recording
```

---

## Frontend File Structure

```
frontend/
├── app/                      ← Next.js App Router pages
│   ├── login/
│   ├── signup/
│   ├── onboarding/
│   ├── dashboard/
│   ├── discovery/
│   └── chat/
├── features/                 ← Feature-based frontend modules
│   ├── auth/
│   ├── chat/
│   ├── connection/
│   ├── dashboard/
│   ├── discovery/
│   ├── matching/
│   └── onboarding/
├── components/               ← Shared UI components
├── services/                 ← API call abstractions
├── store/                    ← State management
└── lib/                      ← Utility helpers
```

---

## Frontend UX Baseline

- All UI must be mobile-responsive and usable on common phone widths.
- Core journeys (`/login`, `/signup`, `/onboarding`, `/dashboard`, `/discovery`, `/chat`) must remain touch-friendly.
- Frontend changes should avoid desktop-only interaction assumptions.
- Implement UI in a PWA-friendly way so installable web app support can be introduced later without major redesign.

---

## Request Lifecycle (HTTP)

```
Client Request
    │
    ▼
Express (app.js)
    │  CORS → express.json() → cookie-parser
    │
    ▼
Route Handler (e.g. authRouter)
    │  [verifyJwt middleware — protected routes only]
    │    └── extract token (cookie > Authorization header)
    │    └── jwt.verify(token, JWT_SECRET)
    │    └── User.findById(payload.sub) → req.user
    │
    ▼
Controller (thin layer)
    │  asyncHandler wraps → passes error to errorHandler on throw
    │  calls service function
    │
    ▼
Service (all business logic)
    │  validates input
    │  interacts with Mongoose models
    │  throws AppError on failure
    │
    ▼
Controller returns: res.status(xxx).json({ message, data })
    │
    ▼
errorHandler (global) — catches AppError and Mongoose errors
    └── returns { message } or { message, stack } (dev only)
```

---

## Auth Flow

```
Signup / Login
    │
    ▼
auth.service.js
    ├── validate email + password
    ├── bcrypt.hash (signup) / bcrypt.compare (login)
    ├── jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn })
    └── returns { user }
    │
    ▼
auth.controller.js
    ├── res.cookie("accessToken", token, { httpOnly, secure, sameSite, maxAge })
    └── res.json({ message, data: { user } })

Protected Route Access
    │
    ▼
verifyJwt middleware
    ├── reads req.cookies.accessToken OR Authorization: Bearer header
    ├── jwt.verify(token, JWT_SECRET) → payload.sub = userId
    ├── User.findById(userId).select([safe fields]).lean()
    └── req.user = user → next()
```

---

## Matching Flow

```
POST /api/match/find (or /api/matches/find)
    │  requires: verifyJwt, onboardingCompleted: true
    │
    ▼
match.service.findBestMatchForUser(userId)
    │
    ├── 1. Expire stale match state for requester if needed
    │      - activeMatchExpiresAt <= now
    │      - partner inactive for 48h
    │      - missing partner cleanup
    │      - reverse one-sided repair for stale links
    │
    ├── 2. Read ranked candidates from shared match engine:
    │       match.engine.getRankedMatches(user)
    │
    ├── 3. Canonical candidate filter:
    │       {
    │         _id: { $ne: userId },
    │         onboardingCompleted: true,
    │         lastActiveAt: { $gte: now-24h },
    │         $or: [
    │           matchedUserId: null,
    │           activeMatchExpiresAt: null,
    │           activeMatchExpiresAt: { $lte: now }
    │         ]
    │       }
    │
    ├── 4. Domain scoping:
    │       if same-domain candidates exist, rank only within same domain
    │
    ├── 5. Score via shared scoring function:
    │       100 role+experience
    │        90 role
    │        80 specialization+experience
    │        70 specialization
    │        60 domainArea+experience
    │        50 domainArea
    │        40 fallback
    │
    ├── 6. Symmetric assignment in MongoDB transaction:
    │       A.status="matched", A.matchedUserId=B
    │       B.status="matched", B.matchedUserId=A
    │       abort on race/conflict
    │
    ├── 7. Lifecycle chat readiness:
    │       chat.service.createConversationIfNotExists(A, B)
    │
    └── Response: { matched: true, matchScore, partner, conversationId }

### Match Lifecycle

- Matches are time-bound for 48h using `activeMatchExpiresAt`
- Dashboard and match lookup clean expired state before responding
- Manual rematch is exposed at `POST /api/match/rematch`
- Rematch is rate-limited by `lastMatchAt` with a 24h cooldown
- Existing `status` and `matchedUserId` fields remain for backward compatibility

### Promote Connection to Match

- Connected users can send a promotion request via `POST /api/match/promote`
- Target user accepts via `POST /api/match/promote/accept`
- On acceptance:
  - Existing matches (both users) are atomically broken
  - A new 1:1 match is created in a MongoDB transaction
  - Pending request is removed atomically via `$pull`
- Cooldown enforcement:
  - Both users must pass 24h `lastMatchAt` cooldown for acceptance
  - Sender cooldown checked on send
- Race-condition safety:
  - Send uses atomic `$ne` guard to prevent duplicate requests
  - Accept uses transactional read-verify-write
  - `clearMatchState` reuses existing match-breaking logic
- Promoted match behaves identically to system-generated match (same expiry, lifecycle, accountability)
```

---

## Visibility / Relation Flow

```
connection.visibility.getUserRelationState(currentUser, targetUser)
    │
    ├── hidden           → self
    ├── matched          → either direction has matchedUserId link
    ├── connected        → either direction has connections[] link
    ├── pending_sent     → current -> target pending request
    ├── pending_received → target -> current pending request
    └── available        → visible in discovery/suggestions
```

This relation engine is the single source of truth for connection discovery visibility.

---

## Realtime (Socket.IO) Flow

```
Client Connect
    │
    ├── Token extracted from: handshake.auth.token → Authorization header → cookie
    ├── jwt.verify → User.findById → socket.data.user = user
    └── socket.join("user:<userId>")  ← personal room

Client Events (client → server):
    │
    ├── "join_conversation" { partnerId }
    │     └── createConversationIfNotExists → socket.join("conversation:<id>")
    │     └── ack: { ok: true, conversation }
    │
    ├── "send_message" { conversationId, content, type, metadata }
    │     └── sendConversationMessage → emits to conversation room
    │     └── ack: { ok: true, ...messageResult }
    │
    └── "mark_seen" { messageId }
          └── markMessageSeen → emits to conversation room
          └── ack: { ok: true, message }

Server Emit Rooms:
    - "conversation:<conversationId>" — all participants in a conversation
    - "user:<userId>"                 — direct to specific user
```

---

## Activity / Check-in Flow

```
Dashboard load → GET /api/user/dashboard
    └── updateLastActive(userId) called first (sets lastActiveAt = now)
    └── returns { user, todayStatus, partner, matching }

Check-in (TODO: confirm if HTTP endpoint exists or socket-only)
    └── activity.service.recordCheckIn(userId, status)
          ├── validates status: "done" | "not_done"
          ├── prevents duplicate check-in same day
          ├── calculates streakCount (via activity.utils.calculateNextStreakCount)
          └── pushes to checkInHistory array
```

---

## Route Prefix Map

| Prefix            | Feature       | Auth Required |
|-------------------|---------------|---------------|
| GET /health       | Health check  | No            |
| /api/auth         | Auth          | No            |
| /api/user         | User/Profile  | Yes           |
| /api/match        | Matching      | Yes           |
| /api/matches      | Matching (alias) | Yes        |
| /api/connection   | Connection    | Yes           |
| /api/discovery    | Discovery     | Yes           |
| /api              | Chat (base)   | Mixed         |
| /api/chats        | Chat (alias)  | Mixed         |

---

## Rate Limiting and Realtime Scaling

- **HTTP**: `express-rate-limit` is configured with separate limits for authentication and general API routes:
  - **General API Limiter**: Applies to all `/api/*` routes (skipping `/api/auth/*` and `/health`). Defaults to 1000 requests per 15 minutes per IP; configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`.
  - **Auth API Limiter**: Applies specifically to `/api/auth/*` routes. Defaults to 100 requests per 15 minutes per IP; configurable via `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`.
  - Both return `429` with standard `RateLimit-*` headers and a JSON response of `{ message: "Too many requests. Please try again later.", data: null }`.
- **Socket.IO**: When `REDIS_URL` is set, `@socket.io/redis-adapter` enables multi-instance broadcast; without it, in-memory adapter is used (single process).


Local staging stack: root `docker-compose.yml` (backend, frontend, MongoDB, Redis).

---

## Known Patterns

- **asyncHandler**: wraps every async controller to catch errors → passes to `next(err)` → `errorHandler`
- **AppError**: custom error class — `throw new AppError("msg", statusCode)` in services
- **Serialization**: controllers and services manually serialize objects (no `.toObject()` leak)
- **Lean queries**: `.lean()` used consistently for read operations
- **Idempotency**: `generateDisplayName` and `createConversationIfNotExists` are idempotent

---

## Startup Sequence

```
bootstrap() in server.js
    1. connectDatabase(MONGO_URI)
    2. backfillDomainAreaForExistingUsers()  ← migration for existing users
    3. seedInterviewTemplates()
    4. createServer(app)
    5. await initializeChatSocket(httpServer) ← Socket.IO; Redis adapter when `REDIS_URL` is set
    6. httpServer.listen(PORT)
    7. Register SIGTERM / SIGINT handlers for graceful shutdown (closes HTTP, Redis, Mongo)
```

---

## Professional Exchange System (Phase 2)

New backend features:
- `exchange/`: reciprocal professional and sensitive exchange lifecycle
- `capability/`: relevance, capability, reciprocity scoring + contextual warnings
- `trust/`: trust tier and exchange reputation calculations
- `verification/`: community consistency verification signals

Realtime updates:
- `exchange_updated`
- `exchange_trust_updated`

Security:
- participant-only exchange visibility
- sensitive layer requires dual approval
- abuse reporting applies trust penalties and audit logs

---

## Interview Session State Flow (Phase 2 Async)

Interview sessions inside chat conversations follow:

`pending -> active -> paused/completed/cancelled`

- `pending`: request created, waiting for participant acceptance
- `active`: interview mode in progress (question dispatch + answer flow)
- `paused`: either participant can pause; question index is preserved
- `completed`: interviewer submits feedback/ratings or participants complete explicitly
- `cancelled`: request declined before activation

Interview modes:
- `text_async`: asynchronous question/answer interview flow inside chat
- `live_online`: same flow but progression requires both participants socket-online
- `live_video`: reserved for upcoming implementation (UI-visible stub)

Live-online presence behavior:
- Socket presence is source of truth for online checks
- If either participant disconnects while `live_online` session is `active`, session auto-pauses and both users receive an interview update event
- `live_online` scheduling lifecycle: `proposed -> confirmed -> active` (or `missed/cancelled`)
- Live-online request carries 2–3 UTC proposed slots and timezone hint
- If confirmed slot passes while a participant is offline, session transitions to `paused` + `missed` and prompts reschedule
- On slot confirmation, backend attempts Google Calendar event creation for both users (partial success allowed)
