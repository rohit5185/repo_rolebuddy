# Professional Progress UI Integration — Design

# Overview

This change integrates professional progress indicators into existing frontend experiences.

All metrics are backend-derived.

Frontend must never duplicate business logic.

---

# Dashboard Integration

## Professional Progress Card

Add a compact dashboard card displaying:

* Consecutive Active Days
* Contribution Count
* Reliability Label
* Preparation Status

---

## Example Layout

```text id="v4oz31"
21-Day Consistency
12 Contributions
Highly Reliable
Preparing Actively
```

---

## UI Rules

* Compact layout
* Mobile-first
* Minimal visual noise
* No flashy animations
* No gaming visuals
* Use typography hierarchy for emphasis

---

# Discovery Card Integration

## Add Indicators

Each discovery card should display:

* Reliability Label
* Contribution Count
* Active Recently

---

## Example

```text id="g0bqsr"
Node.js Backend Engineer

Highly Reliable
12 Contributions
Active Today
```

---

## Display Rules

### Reliability

Only show if backend provides label.

### Contribution Count

Always show.

### Active Recently

Derived from backend boolean.

---

## UI Constraints

* Must not increase card height excessively
* Preserve readability
* Preserve scanning speed
* Keep mobile layouts compact

---

# Chat Integration

## Chat Header / User Meta

Display:

* Active Today
* Reliability Label
* Contribution Summary

---

## Example

```text id="n6g4o0"
Active Today
Highly Reliable
Shared 8 Experiences
```

---

## Placement

Place indicators:

* near participant info
* above conversation area
* without reducing usable message space

---

# API Consumption

Frontend consumes:

## Dashboard API

```json id="qlhzsw"
{
  "consistencyStreak": 12,
  "contributionCount": 8,
  "reliability": {
    "label": "Highly Reliable"
  },
  "preparationStatus": "Preparing Actively"
}
```

---

## Discovery API

```json id="ln7n55"
{
  "activeRecently": true,
  "contributionCount": 8,
  "reliabilityLabel": "Highly Reliable"
}
```

---

## Chat/Profile API

```json id="gzh5ln"
{
  "activeToday": true,
  "contributionCount": 8,
  "reliabilityLabel": "Highly Reliable"
}
```

---

# Loading States

## Requirements

* Prevent layout shift
* Use lightweight skeletons/placeholders
* Maintain responsive sizing

---

# Empty States

## Reliability

If no label:

* hide completely

Do NOT display:

* “Unreliable”
* low scores
* warning indicators

---

# Responsive Design

## Mobile Requirements

* compact spacing
* proper wrapping
* no overflow
* maintain readability

---

## Desktop Requirements

* preserve current layout balance
* avoid oversized metrics sections

---

# Accessibility

* maintain text contrast
* avoid color-only meaning
* maintain readable typography hierarchy

---

# Non-Goals

This change does NOT introduce:

* badges
* XP bars
* levels
* points
* leaderboard UI
* reward popups
* gaming animations
