# Promote Connection to Match

## Problem

Currently, users can:

* Get auto-matched by the system (1:1)
* Connect with other users manually

However, there is a gap:

* Users may find a better accountability partner via connections
* But they cannot convert that connection into an official match
* Only system-generated matches get access to:

  * daily check-ins
  * streak tracking
  * accountability mechanics

This creates friction and reduces user control.

---

## Goals

* Allow users to convert an existing connection into an official match
* Maintain strict 1:1 accountability model
* Preserve system integrity and behavioral design
* Enable intentional partner selection without breaking matchmaking

---

## Non-Goals

* No multi-partner matching
* No group matching
* No bypass of accountability mechanics
* No open matchmaking outside connections

---

## Proposed Solution

Introduce a **"Promote Connection to Match"** feature:

1. A user can send a match promotion request to a connected user
2. The target user must accept the request
3. Upon acceptance:

   * Existing matches (if any) are broken
   * A new official match is created between the two users
4. The new match follows all existing accountability rules

---

## Impact

* Improves user control and satisfaction
* Aligns with real user behavior (manual discovery → intentional pairing)
* Strengthens retention through better partner fit
* Maintains system structure and 1:1 model
