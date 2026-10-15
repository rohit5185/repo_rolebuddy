# Professional Progress Foundation — Design

## Overview

This change introduces a lightweight professional preparation progress system.

The system is backend-driven and derived from existing platform activity.

No separate gamification engine will be introduced.

---

# Data Model Updates

## User Model Additions

Add fields:

```js
consistencyStreak: {
  type: Number,
  default: 0
},

lastActiveDay: {
  type: String,
  default: null
},

contributionCount: {
  type: Number,
  default: 0
},

completedMockInterviews: {
  type: Number,
  default: 0
},

completedExchanges: {
  type: Number,
  default: 0
},

completedSensitiveExchanges: {
  type: Number,
  default: 0
},

totalAcceptedCommitments: {
  type: Number,
  default: 0
},

completedCommitments: {
  type: Number,
  default: 0
},

reliabilityScore: {
  type: Number,
  default: null
},

reliabilityLabel: {
  type: String,
  default: null
},

preparationStatus: {
  type: String,
  enum: [
    "Starting Preparation",
    "Preparing Actively",
    "Interview Ready"
  ],
  default: "Starting Preparation"
}
```

---

# Consistency Tracking

## Active Day Definition

A user receives an active day if they perform at least one of:

* send connection request
* accept connection request
* send at least one chat message
* schedule mock interview
* attend mock interview
* complete mock interview

---

## Streak Logic

If user performs qualifying activity:

* same day:
  no streak increment

* next calendar day:
  increment streak

* gap greater than 1 day:
  reset streak to 1

System uses normalized calendar day boundaries.

---

# Contribution Tracking

Contribution count increments on:

* completed mock interview
* completed interview experience exchange
* completed mutual sensitive exchange

Contribution count is cumulative.

---

# Reliability Calculation

## Formula

```text
Reliability % =
(completedCommitments / totalAcceptedCommitments) * 100
```

---

## Reliability Labels

### Under 3 total commitments

No public label shown.

### 90–100

Highly Reliable

### 80–89

Reliable

### Below 80

No public label.

Low scores may still be used internally for discovery ranking.

---

# Preparation Status

## Starting Preparation

Criteria:

* 0 contributions
  OR
* consistency streak < 3

---

## Preparing Actively

Criteria:

* 1+ contributions
  AND
* consistency streak >= 3

---

## Interview Ready

Criteria:

* 5+ contributions
* at least 1 completed mock interview
* consistency streak >= 14

---

# Service Architecture

## activity.service.js

Responsible for:

* tracking active day
* streak updates

---

## contribution.service.js

Responsible for:

* contribution increments
* completed interaction tracking

---

## reliability.service.js

Responsible for:

* reliability calculation
* label generation

---

## preparation.service.js

Responsible for:

* preparation status calculation

---

# API Updates

## Dashboard API

Add:

```json
{
  "consistencyStreak": 12,
  "contributionCount": 8,
  "reliability": {
    "score": 96,
    "label": "Highly Reliable"
  },
  "preparationStatus": "Preparing Actively"
}
```

---

## Discovery API

Add:

```json
{
  "activeRecently": true,
  "contributionCount": 8,
  "reliabilityLabel": "Highly Reliable"
}
```

---

## Chat/Profile APIs

Add:

```json
{
  "activeToday": true,
  "contributionCount": 8,
  "reliabilityLabel": "Highly Reliable"
}
```

---

# Performance Notes

* Prefer derived updates during activity writes
* Avoid expensive aggregation pipelines
* Use lean queries where possible
* Keep calculations deterministic
* Avoid realtime recalculation on every request

---

# Migration Notes

Existing users:

* default contributionCount = 0
* default consistencyStreak = 0
* default preparationStatus = "Starting Preparation"

No destructive migration required.

---

# Non-Goals

This change does NOT introduce:

* XP
* levels
* badges
* points
* leaderboards
* notification systems
* AI scoring
