# Discovery V2 Foundation — Design

# Overview

The Discovery page evolves from a simple recommendation list into a segmented ecosystem exploration interface.

The implementation must preserve all existing discovery logic while introducing role-centric exploration.

---

# Discovery Page Structure

## Top Section

### Search Bar

Persistent search input at top.

Supports:

* role search
* skill search
* quick filtering

UI should feel modern and clean.

---

## Segmented Navigation

Three segmented tabs:

1. Recommended
2. Communities
3. Trending

Requirements:

* mobile-first
* horizontally aligned
* animated active state
* smooth transitions
* sticky behavior optional
* clean visual hierarchy

The segmented navigation controls the content area below WITHOUT page reloads.

---

# TAB 1 — Recommended

## Purpose

Preserve and enhance the current personalized discovery system.

## Data Source

Reuse current discovery/matching logic exactly as implemented.

## Requirements

* preserve match % ordering
* preserve active user logic
* preserve recommendation prioritization
* preserve existing backend integration

## UI Enhancements Allowed

* modern cards
* better spacing
* avatars/placeholders
* cleaner metadata presentation
* smoother animations
* improved mobile responsiveness

## Card Design

Each recommendation card may include:

* match percentage
* role
* specialization
* experience level
* activity status
* daily goal
* CTA buttons

Cards should feel:

* actionable
* trustworthy
* clean
* non-social

---

# TAB 2 — Active Role Communities

## Purpose

Introduce ecosystem feeling without changing current matching flows.

## Card Layout

Each role community card should include:

* role title
* aspirants preparing count
* active today count
* top skills/tags
* optional ecosystem label
* Explore Role CTA

Example:
Node.js Developer
2.3k preparing
381 active today

Express.js • MongoDB • APIs

[ Explore Role ]

---

# Community Card UX

Cards should visually feel:

* alive
* active
* preparation-focused
* ecosystem-oriented

Avoid:

* social feed appearance
* influencer/content style
* noisy visuals

---

# TAB 3 — Trending Preparation Areas

## Purpose

Expose broader preparation categories and platform depth.

## Examples

* Backend Development
* Data Analytics
* Product Design
* DevOps
* AI/ML

## Layout

Grid or horizontal card layout.

Each area card may include:

* category title
* active growth indicator
* aspirant count
* trending tags

---

# Mobile UX

This implementation MUST prioritize mobile UX first.

Requirements:

* proper touch targets
* horizontal segmented navigation support
* responsive card stacking
* no overflow issues
* smooth scrolling
* polished transitions

---

# Animation Requirements

Use subtle modern transitions:

* tab switching animations
* card hover states
* loading skeletons
* active tab indicators

Animations must remain lightweight and professional.

---

# Backend Notes

This phase should primarily reuse existing discovery APIs.

Minimal aggregation endpoints may be added for:

* role communities
* trending preparation areas

No matching logic changes allowed.

---

# Future Compatibility

This design must support future additions:

* role detail pages
* role analytics
* peer interview mode
* ecosystem insights
* preparation stages

Architecture should remain extensible.
