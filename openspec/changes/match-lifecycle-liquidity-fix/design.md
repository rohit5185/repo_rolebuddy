# Match Lifecycle Design

## Overview

This change introduces a **non-permanent match lifecycle**.

### Current Behavior

* Matches are permanent
* Users are removed from matchmaking pool

### New Behavior

* Matches are time-bound
* Users automatically return to pool
* Users can manually trigger rematch

---

## Data Model Changes

Extend `User` schema:

```js
activeMatchExpiresAt: Date | null
lastMatchAt: Date | null
```

---

## Match State Definitions

### Active Match

```
status === "matched"
AND activeMatchExpiresAt > now
```

### Expired Match

```
activeMatchExpiresAt <= now
OR partner.lastActiveAt < now - 48h
```

---

## Match Expiry Logic

Trigger points:

* Dashboard fetch
* Match request

If match is expired:

* Update BOTH users:

  * status → "waiting"
  * matchedUserId → null
  * activeMatchExpiresAt → null

---

## Match Creation Update

On new match:

* status = "matched"
* matchedUserId = partnerId
* activeMatchExpiresAt = now + 48h
* lastMatchAt = now

Must update both users atomically.

---

## Matching Eligibility Update

### Old

```
status === "waiting"
```

### New

```
User has NO active (non-expired) match
```

---

## Rematch Feature

### API

```
POST /api/match/rematch
```

### Behavior

* Break current match
* Run matching again

### Constraint

* Cooldown: 24 hours

---

## Discovery Behavior

* Show ALL active users
* Do NOT filter by `status`
* Include both matched and waiting users

---

## Edge Cases

* One-sided expiry → enforce dual update
* Race conditions during matching → atomic updates
* Missing partner → cleanup state
* Rematch abuse → cooldown enforcement

---

## Backward Compatibility

* Existing APIs unchanged
* `status` field retained
* Matching logic extended, not replaced
