# Fix Matchmaking Liquidity & Introduce Match Lifecycle

## Problem

Current system uses strict 1:1 matching with:

* `status: "waiting" | "matched"`
* Matched users are removed from matchmaking pool

This creates a **liquidity collapse problem**:

* Pool frequently becomes empty
* New users cannot find matches
* Users get stuck waiting for future signups
* Poor onboarding experience → high churn risk

---

## Goals

* Preserve strict 1:1 accountability model
* Prevent pool from draining to zero
* Allow users to re-enter matchmaking pool
* Introduce user control via rematch
* Ensure no user is blocked due to lack of matches

---

## Non-Goals

* No multi-partner matching
* No group matching
* No changes to accountability mechanics
* No AI-based matching or recommendations

---

## Proposed Solution

Introduce a **match lifecycle system**:

1. Matches expire automatically after a fixed duration (48h)
2. Inactive partners trigger match expiry
3. Users re-enter matchmaking pool after expiry
4. Users can manually rematch (with cooldown)
5. Matching eligibility is based on active match state instead of strict status

---

## Impact

* Improves system liquidity
* Prevents onboarding deadlocks
* Maintains core product identity (1:1 accountability)
* Improves user retention and flexibility
