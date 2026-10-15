# Promote Connection to Match — Design

## Overview

This feature bridges the gap between:

* Connection system (user-driven)
* Match system (system-driven)

It allows users to **intentionally choose their accountability partner** while preserving system constraints.

---

## Flow

1. User A sends promotion request to User B
2. User B receives request
3. User B accepts
4. System:

   * Breaks existing matches (if any)
   * Creates a new 1:1 match between A and B

---

## Data Model Changes

Extend `User` schema:

```js id="k2q9ax"
pendingMatchRequests: [
  {
    from: ObjectId,
    createdAt: Date
  }
]
```

---

## API Design

### Send Promotion Request

```http id="e9l1sp"
POST /api/match/promote
```

Request:

```json id="j3z8kd"
{
  "targetUserId": "<userId>"
}
```

Behavior:

* Validate both users are connected
* Prevent duplicate requests
* Add request to target user's pendingMatchRequests

---

### Accept Promotion Request

```http id="v1m8qa"
POST /api/match/promote/accept
```

Request:

```json id="y7p2rc"
{
  "fromUserId": "<userId>"
}
```

Behavior:

* Validate request exists
* Break existing matches (both users)
* Create new match
* Remove pending request

---

## Rules

### Rule 1 — Mutual Consent

* Match only created after acceptance

### Rule 2 — 1:1 Enforcement

* Existing matches must be broken before creating new one

### Rule 3 — Cooldown

* Reuse rematch cooldown (24h)

### Rule 4 — Connection Required

* Only users in `connections[]` can be promoted

### Rule 5 — Full System Integration

* Promoted match behaves exactly like system-generated match

---

## Edge Cases

* Duplicate requests → prevent
* Missing request on accept → reject
* One user already rematched recently → enforce cooldown
* Partner inactive → still allow (user intent overrides system)
* Concurrent promotion requests → handle safely

---

## Backward Compatibility

* Existing match system unchanged
* Existing connection system unchanged
* This feature is additive only
