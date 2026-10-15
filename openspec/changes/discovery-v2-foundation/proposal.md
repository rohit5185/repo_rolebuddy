# Discovery V2 Foundation — Proposal

## Objective

Upgrade the existing Discovery page into a modern role-centric exploration experience WITHOUT breaking the current matching/discovery system.

The current discovery experience already works well:

* active users are shown
* higher match % users appear first
* discovery is personalized

This behavior MUST remain unchanged.

The goal of this phase is NOT to replace the existing system.

The goal is to evolve discovery into:
“A preparation ecosystem explorer.”

This implementation introduces a segmented/tab-based discovery interface with three sections:

1. Recommended For You
2. Active Role Communities
3. Trending Preparation Areas

This should feel like a modern mobile-first product experience.

---

# Product Goals

The new discovery experience should:

* strengthen role identity
* make the platform feel alive
* communicate that serious aspirants exist here
* improve exploration without overwhelming users
* preserve the current personalized matching flow
* maintain preparation-focused identity
* avoid social media/feed behavior

---

# Scope

## Included

### Discovery UI V2

* segmented/tab-based navigation
* animated tab switching
* responsive mobile-first design
* polished modern UI

### Tab 1 — Recommended For You

* preserve ALL existing discovery logic
* preserve current ranking behavior
* preserve match percentage logic
* preserve current active user recommendations
* UI improvements allowed ONLY if functionality remains identical

### Tab 2 — Active Role Communities

Display role ecosystem cards.

Each card includes:

* role name
* total aspirants count
* active today count
* top skills/tags
* short ecosystem/preparation context
* CTA button: Explore Role

This section is informational only for now.

No role detail pages in this phase.

### Tab 3 — Trending Preparation Areas

Display broader preparation categories such as:

* Backend Development
* Data Analytics
* Product Design
* DevOps
* Cybersecurity

This section helps ecosystem discovery and platform depth.

No deep navigation required yet.

---

# Critical Product Rules

* DO NOT break existing discovery logic
* DO NOT change existing matching algorithms
* DO NOT modify chat/accountability flows
* DO NOT add social posting systems
* DO NOT add public comments/likes
* DO NOT introduce social-media style feed behavior
* DO NOT expose any PII
* Discovery must remain preparation-focused
* Existing APIs should remain functional

---

# UX Requirements

The UI must feel:

* premium
* modern
* mobile-first
* smooth
* clean
* minimal
* highly readable

The segmented discovery navigation should feel similar to modern app experiences.

Use:

* smooth transitions
* subtle hover states
* polished cards
* proper spacing
* responsive layouts
* excellent typography hierarchy

The design should visually communicate:
“serious aspirants preparing together.”

---

# Technical Constraints

* Preserve existing architecture
* Preserve existing API contracts where possible
* Reuse current discovery data
* Keep implementation modular
* Follow existing frontend feature structure
* No backend rewrite
* No breaking route changes

---

# Success Criteria

Discovery should now:

* feel alive
* feel role-centric
* preserve personalization
* improve exploration
* maintain accountability-focused identity
* scale cleanly for future role ecosystem phases
