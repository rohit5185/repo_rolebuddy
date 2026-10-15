# AGENTS.md — AI Agent Protocol for RoleBuddy

This file defines **mandatory behavior rules** for any AI agent (Copilot, Cursor, Claude, Gemini, etc.) working on this codebase.

Read every section. Do not skip.

---

## PART A — WHAT IS ROLEBUDDY

### Product Summary

RoleBuddy is a **role-based peer accountability platform for job preparation**.

It is NOT a content platform. It is NOT a job board. It is NOT a social network.

It is an **accountability system** that:
- Matches users who are preparing for the **same job role** (e.g., "Backend Node.js Engineer", "Frontend React Engineer")
- Pairs them as accountability partners
- Keeps them consistent through **daily check-ins**, **streak tracking**, and **partner visibility**
- Creates a behavioral loop that makes dropping off harder than staying in

The core product insight (from research phase, documented in `RoleBuddy- Research Phase Documentation.md`):

> Job preparation fails because it is **isolated, unstructured, and inconsistent** — not because of lack of content.
> The solution is not more study material. It is **peer pressure + accountability mechanics**.

---

### The Problem Being Solved

Target users are:
- **Primary**: Final-year CS/IT students and freshers (0–2 years experience) preparing for tech roles (frontend, backend, data, etc.)
- **Secondary**: Career switchers, early professionals

These users face:
1. No one preparing for the SAME role around them
2. No accountability → lose consistency after a few days
3. No real peer feedback loop
4. Hard to stay motivated alone

Existing solutions (LinkedIn, Discord, LeetCode, Glassdoor) solve **fragments** of this — networking, or content, or community — but none solve the **daily accountability** loop.

---

### Core Value Proposition

1. **Structured preparation** — users set role, experience, goals, and availability
2. **Peer accountability** — matched with someone at the same level and role
3. **Consistency mechanics** — daily check-ins, streaks, partner visibility in dashboard
4. **Real-world insights** — chat with actual peers, not content feeds

The product survives only if **users return daily**. The North Star Metric is:

> "Weekly active accountability pairs"

---

### What Has Been Built (Phase 1 — Complete)

The following is fully implemented and production-ready:

| Feature | What It Does |
|---------|-------------|
| **Auth** | Signup, login, JWT via HttpOnly cookie + Bearer header fallback |
| **Onboarding** | Structured profile capture: domain, role, experience, specialization, skills, goals, daily goal, availability |
| **Matching engine** | Hierarchical scoring (role+exp → role → specialization+exp → specialization → domainArea+exp → domainArea → fallback). Active within 24h only. |
| **Dashboard** | User's streak count, last check-in, partner status, today's accountability status |
| **Discovery** | Role-based aggregate search (total/active/waiting users per role), sample users per role |
| **Connection system** | Send/accept/reject connection requests, anonymous display names, suggestions ranked by match score |
| **Chat (REST + Realtime)** | Create conversations, paginated message fetch, send messages, mark seen, Socket.IO realtime delivery |
| **Accountability mechanics** | System-generated daily check-in prompt, check-in response (done/not_done), streak increment logic, alert message to partner on missed goal |
| **Activity tracking** | `lastActiveAt` heartbeat, `streakCount`, `lastCheckInDate`, `checkInHistory` per user |

---

### What Is NOT Built Yet (Future)

These are **known research items** that are deliberately excluded from Phase 1 scope:

- AI-powered partner suggestions or study plans
- Gamification (badges, leaderboards, points)
- Mock interview scheduling
- Group chat (>2 users)
- Company-specific threads
- Advanced analytics and KPI dashboards
- Notification system (push/email)
- Rate limiting and brute-force protection (auth hardening)
- Trust/safety moderation system (reporting, verification)
- Session scheduling with calendar integration

**Do NOT add these unless explicitly instructed.**

---

### User Journey (Implemented)

```
1. User lands → redirected to /login
2. User signs up with email + password
3. User completes onboarding (role, experience, goals, availability)
4. User goes to dashboard → triggers match → gets paired with a partner
5. User can also discover profiles, send/accept connection requests
6. User creates or opens conversation with matched or connected partner
7. Every day: system sends a daily check-in prompt
8. User responds (done / not_done) → streak updates, partner sees accountability state
9. If partner misses goal → alert message auto-generated in chat
```

---

### Behavioral Design Context (Why The Product Is Designed This Way)

This is important for AI agents to understand **why** certain features exist:

- **Streak tracking** — leverages habit psychology. Breaking a streak feels costly.
- **Partner visibility** — social accountability. Knowing your partner can see your check-in status creates pressure.
- **Daily check-in in chat** — makes the chat the accountability artifact, not just a messaging tool.
- **Role-based matching** — ensures both partners understand each other's problems (not generic "study buddy")
- **Alert messages** — partner gets notified when the other misses a goal → creates mutual accountability
- **Anonymous display names** — reduces friction of connecting with strangers; trust built gradually

---

## PART B — MANDATORY READING ORDER

Before generating any output, read the following in order:

1. `openspec/config.yaml` — tech stack, coding rules, API conventions
2. `openspec/specs/_core/architecture.md` — system design, auth flow, matching flow, socket flow
3. `openspec/specs/_core/database-schema.md` — all Mongoose models and indexes
4. `openspec/specs/_core/api-reference.md` — all HTTP endpoints, request/response contracts

If working on a specific feature, also read:
- `openspec/changes/<phase>/design.md`
- `openspec/changes/<phase>/tasks.md`

---

## PART C — CODING RULES

### Rule 1 — No Hallucination

- Do NOT invent APIs, fields, or logic not present in code
- Do NOT add fields to models not currently defined
- Do NOT assume behavior — read the service files
- If something is unclear → mark as `TODO:` and stop

### Rule 2 — Feature-Based Architecture

All code MUST follow the existing feature-based structure:

```
backend/src/features/<feature>/
  ├── <feature>.controller.js   ← thin: calls service, returns response
  ├── <feature>.routes.js       ← registers handlers + middleware only
  ├── <feature>.service.js      ← ALL business logic lives here
  └── <feature>.model.js        ← Mongoose schema only (if model exists)
```

### Rule 3 — Response Format (Mandatory)

Every HTTP endpoint MUST return:

```json
{ "message": "...", "data": { ... } }
```

Errors also follow this shape:
```json
{ "message": "...", "data": null }
```

No exceptions. See `openspec/specs/_core/api-reference.md` for all contracts.

### Rule 4 — Security Rules

- All protected routes use `verifyJwt` middleware
- JWT is read from `req.cookies.accessToken` (HttpOnly) OR `Authorization: Bearer <token>` header
- Never expose `password` field in any response
- Never return raw Mongoose documents — always call the feature serializer

### Rule 5 — OpenSpec Is the Contract

- If code contradicts the spec → report it as a mismatch, do NOT silently resolve it
- If you add a new endpoint → update `openspec/specs/_core/api-reference.md` immediately
- If you change a model → update `openspec/specs/_core/database-schema.md` immediately
- If you add a new phase → create `openspec/changes/<phase-name>/` with `proposal.md`, `design.md`, `tasks.md`

### Rule 6 — Layered Execution Order

When implementing a new feature, ALWAYS follow this order:

1. **Database** — indexes, schema changes first
2. **Backend** — service → controller → route
3. **Frontend** — service call → state → UI component
4. **Testing** — smoke tests

Do NOT mix or reorder layers.

### Rule 7 — Consistency Enforcement

- All text schema fields: `trim: true`
- All validation errors: throw `AppError` with appropriate HTTP status
- All async route handlers: use `asyncHandler` wrapper
- All Socket events: use acknowledgment callbacks `(payload, ack) => {}`

### Rule 8 — Output Discipline

- No explanations unless asked
- No placeholder code
- No `// TODO: implement this` stubs in production paths
- If you cannot confidently implement something → mark `TODO:` and explain why

---

## PART D — PRODUCT GUARDRAILS

These are non-negotiable product decisions that must not be reversed without explicit instruction:

1. **Matching is 1:1 only** — no group matching, no multi-partner support
2. **Chat is between matched or connected users only** — no open DMs to strangers
3. **Daily check-in is system-generated** — users cannot create a `daily_checkin` type message manually
4. **Anonymous display names are optional** — a user may not have one until they generate it
5. **Matching scores only count active users (last 24h)** — inactive users must not enter the match pool
6. **Streak only increments on consecutive `done` check-ins** — never on `not_done` or missing days
7. **No PII in discovery** — discovery endpoints expose only `role`, `experience`, `dailyGoal`, `status`

---

## PART E — PHASE ROADMAP CONTEXT

### Phase 1 — Complete
Core product functionality: auth, onboarding, matching, dashboard, discovery, connections, chat, accountability mechanics.

### Phase 2 — In Progress / Planned
1. OpenAPI-based API standardization and spec publication ✅ (done)
2. Response format standardization ✅ (done)
3. Trust/safety moderation foundations
4. Stronger retention mechanisms (notifications, richer accountability cycles)
5. Observability and production diagnostics
6. ADR-based architecture decision log

### Future (Not Scoped)
- AI-powered suggestions
- Gamification
- Mock interview scheduling
- Group collaboration (>2 users)
- Mobile app

---

## PART F — OPENSPEC IS GROUND TRUTH

```
Codebase > OpenSpec > Everything Else
```

The spec documents the **current implementation only**.
Do not add aspirational features, future improvements, or ideas to the spec.
If something is not implemented → it does not exist in the spec.
If code contradicts spec → code wins. Update the spec to match.
