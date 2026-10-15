# Proposal — Phase 2: Discovery Feature

**Phase:** 2
**Status:** Planned
**Priority:** High — Core USP

---

## Problem Statement

Currently, users can only find accountability partners by running a match (`POST /api/match/find`), which returns a single opaque match. They have no visibility into:

- How many people are preparing for their role
- Whether their specific role has an active community
- What levels of experience are represented in their role pool
- How active the community is before committing to a match

This creates a **cold start problem**: users don't know if the platform has value for their specific role before investing time in onboarding.

---

## Why This Feature Matters

1. **Discovery = Retention Trigger**: When users can see "42 people are preparing for Frontend Engineer roles", they immediately understand the platform has value for them.

2. **Role-Specific Social Proof**: Showing active users per role builds confidence. "18 active in the last 24h" signals the community is alive.

3. **Informed Matching**: Users who explore their role pool first are more likely to complete onboarding and request a match — because they know a match exists.

4. **Entry Point Clarity**: "Find people preparing for the SAME role" is the product's core promise. Discovery makes this promise visible before the match happens.

---

## Current State (Already Implemented)

The backend discovery feature is **already implemented**:

- `GET /api/discovery/roles?q=<query>` — returns role aggregates (totalUsers, activeUsers, waitingUsers)
- `GET /api/discovery/role/:roleName` — returns sample users for a role

**What is missing** is the frontend integration and potential UX polish for the discovery experience.

---

## Scope of Phase 2

1. Frontend discovery page (`/discovery`) — already has a route directory
2. Role search UI with real-time aggregates
3. Role detail page/modal showing sample users
4. Integration with connection flow from discovery
5. Mobile-responsive and PWA-friendly UX baseline for discovery UI

---

## Success Criteria

- User can search for their role and see aggregate counts
- User can click a role to see sample user data (experience, daily goal, status)
- Discovery page loads under 500ms for cached role aggregates
- Zero PII exposed in discovery (only role, experience, dailyGoal, status)
- Discovery UI remains usable on common phone widths with touch-first interactions
