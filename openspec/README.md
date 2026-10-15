# OpenSpec — RoleBuddy

AI-readable specification system for the RoleBuddy codebase.
All AI agents MUST read this before generating any output.

---

## What Is RoleBuddy?

RoleBuddy is a **role-based peer accountability platform for job preparation**.

**Problem it solves:**
Job preparation fails because it is isolated, unstructured, and inconsistent. Users cannot find peers preparing for the same role. They lose motivation alone. Existing platforms (LinkedIn, Discord, LeetCode) solve fragments — networking, content, or community — but none enforce a **daily accountability loop**.

**Core insight (from research phase):**
> This is NOT a matching platform. This SHOULD BE a consistency + accountability system.

**How it works:**
1. User signs up and completes onboarding (role, experience, goals, availability)
2. Gets matched with a partner preparing for the **same job role**
3. They chat, do daily check-ins, and track each other's streaks
4. The system enforces consistency through behavioral design: partner visibility, streak pressure, alert messages when a partner misses a goal

**Who it is for:**
- Primary: Final-year CS/IT students and freshers (0–2 yrs) preparing for tech roles
- Secondary: Career switchers and early professionals

**North Star Metric:** Weekly active accountability pairs

---

## What Has Been Built (Phase 1)

| Feature | Status |
|---------|--------|
| Auth (signup/login/JWT) | ✅ Complete |
| Onboarding (structured profile capture) | ✅ Complete |
| Matching engine (hierarchical scoring) | ✅ Complete |
| Dashboard (streak, check-in state, partner status) | ✅ Complete |
| Discovery (role aggregates, sample users) | ✅ Complete |
| Connection system (requests, suggestions, search, display names) | ✅ Complete |
| Chat (REST + Socket.IO, conversations, messages, seen state) | ✅ Complete |
| Accountability mechanics (daily check-in, streaks, alert messages) | ✅ Complete |
| Activity tracking (lastActiveAt, checkInHistory) | ✅ Complete |
| OpenAPI spec and response standardization | ✅ Complete |

**Not built yet (future phases):** AI suggestions, gamification, mock interviews, notifications, group chat, rate limiting, trust/safety moderation, advanced analytics, native mobile app.
Web UI changes are still required to be mobile-responsive and future PWA-friendly.

---

## What Is OpenSpec?

OpenSpec is a structured documentation system that serves as the **single source of truth** for AI agents and human engineers.

Rules:
- Documents **only what is currently implemented** — no aspirational features
- Must be kept in sync with the codebase at all times
- Any agent adding a feature MUST update the relevant spec file before finishing

---

## Directory Structure

```
openspec/
├── README.md                        ← This file — product overview + spec index
├── config.yaml                      ← Tech stack, coding rules, API conventions, environment vars
├── specs/
│   └── _core/
│       ├── api-reference.md         ← All HTTP endpoints (extracted from actual routes)
│       ├── database-schema.md       ← All Mongoose models, fields, indexes, relationships
│       └── architecture.md          ← System design, auth flow, matching flow, socket flow
└── changes/
    └── phase-2-discovery/           ← Phase 2 feature work (discovery, connection UX)
        ├── proposal.md              ← Problem statement, why it matters, scope
        ├── design.md                ← API design, DB usage, frontend flow
        ├── tasks.md                 ← Layered task list (DB → Backend → Frontend → Testing)
        └── specs/
            └── discovery/
                └── spec.md          ← Given/When/Then behavior scenarios
```

---

## How to Use (Reading Order)

1. **`config.yaml`** — understand the tech stack, API conventions, response format, security rules
2. **`specs/_core/architecture.md`** — understand request lifecycle, matching algorithm, socket flow
3. **`specs/_core/database-schema.md`** — understand all models, fields, types, indexes
4. **`specs/_core/api-reference.md`** — understand all endpoints, request/response shapes
5. **`changes/<phase>/design.md`** — for feature-specific work, read this before touching code

---

## Key Technical Facts (For Quick Reference)

### Stack
- Backend: Node.js + Express 4 (ES Modules), Mongoose 8, Socket.IO 4, bcryptjs, jsonwebtoken 9
- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Database: MongoDB
- Auth: JWT via HttpOnly cookie (`accessToken`) + `Authorization: Bearer` header fallback

### UI Standards
- Frontend work must be mobile-responsive by default (mobile-first where possible)
- Core flows must remain touch-friendly on common phone widths
- New UI should be PWA-friendly so installable web app support can be added without redesign

### Response Format (All Endpoints)
```json
{ "message": "...", "data": { ... } }
```
Errors:
```json
{ "message": "...", "data": null }
```
No exceptions.

### Matching Algorithm (Hierarchical Relaxation)
Only users who are: `onboardingCompleted: true` AND `lastActiveAt` within last 24h AND not self.

| Score | Condition |
|-------|-----------|
| 100 | Same role + same experience |
| 90  | Same role |
| 80  | Same specialization + same experience |
| 70  | Same specialization |
| 60  | Same domainArea + same experience |
| 50  | Same domainArea |
| 40  | Fallback (any active user) |

### Accountability Loop (How It Works in Code)
1. `POST /api/conversations` → creates conversation, triggers `ensureDailyCheckin()` → inserts system check-in message once per day
2. User responds with `POST /api/messages` (type: `checkin`, status: `done` or `not_done`)
3. `recordCheckIn()` runs → updates streak, `lastCheckInDate`, `checkInHistory`
4. If `not_done` → `maybeCreateAlertMessage()` → inserts alert message to partner

### Feature-Based Backend Structure
```
backend/src/features/<feature>/
  ├── <feature>.controller.js   ← thin: calls service, returns { message, data }
  ├── <feature>.routes.js       ← registers handlers + middleware only
  ├── <feature>.service.js      ← ALL business logic lives here
  └── <feature>.model.js        ← Mongoose schema only
```

Features: `auth`, `user`, `match`, `connection`, `discovery`, `chat`, `activity`

---

## Enforcement Rules

- OpenSpec must exactly match the current codebase
- Mismatches must be reported — never silently resolved
- Any agent adding a feature must update the relevant spec file before done
- Adding a new endpoint → update `specs/_core/api-reference.md`
- Changing a model → update `specs/_core/database-schema.md`
- New phase of work → create `changes/<phase-name>/` with `proposal.md`, `design.md`, `tasks.md`

---

## Source of Truth Priority

```
Codebase > OpenSpec > Everything Else
```

If OpenSpec contradicts code → the code wins. Update the spec.
If code contradicts OpenSpec → report the mismatch. Do not silently fix.

---

## Product Guardrails (Non-Negotiable)

These decisions must not be reversed without explicit instruction:

1. Matching is **1:1 only** — no group matching
2. Chat only between **matched or connected users** — no open DMs
3. `daily_checkin` message type is **system-generated only** — users cannot create it
4. Discovery exposes **no PII** — only `role`, `experience`, `dailyGoal`, `status`
5. Match pool is **active users only** — `lastActiveAt` within 24h
6. Streak increments **only on consecutive `done` check-ins**
7. No AI, gamification, or notification features until explicitly scoped

---

*Prepared for: RoleBuddy codebase — Phase 1 complete, Phase 2 in progress*
*Research origin: `RoleBuddy- Research Phase Documentation.md` (April 2026, Himanshu Chandel)*
