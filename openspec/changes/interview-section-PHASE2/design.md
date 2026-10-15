# Interview System Phase 2 Design

# Architecture Philosophy

Phase 2 extends existing interview infrastructure from Phase 1.

DO NOT:
- redesign interview architecture
- recreate interview systems
- duplicate interview state logic

Phase 2 ONLY extends:
InterviewTemplate capabilities.

---

# High-Level Architecture

Conversation
├── Messages
├── ExchangeSession
└── InterviewSession

InterviewSession
└── InterviewTemplate

InterviewTemplate now supports:
- system templates
- user-created templates

---

# Backend Design

## InterviewTemplate Extensions

Add fields:

- createdBy
- visibility
- isSystemTemplate
- usageCount
- tags
- estimatedDuration

---

# Visibility Values

- private
- public

---

# Ownership Rules

## System Templates
- immutable
- managed internally

## User Templates
- editable by creator only
- deletable by creator only

---

# Question Structure

Questions support:

- question
- type
- followUps
- expectedTopics
- notes

Question types:
- technical
- behavioral
- hr
- resume
- situational

Support BOTH:
- tech
- non-tech roles

---

# Frontend Design

# Template Management UI

Users require:

- create template flow
- edit template flow
- template listing
- template filtering
- template duplication
- template deletion

---

# Template Creation UX

Creation flow should support:

## Basic Info
- title
- role
- domain
- type
- difficulty

## Questions
Dynamic question builder.

Users can:
- add question
- remove question
- reorder question
- add follow-up questions

---

# Interview Integration

When starting interview:

Sidebar now supports:
- system templates
- user templates

Filtering required.

---

# Template Discovery

Public templates require:
- searchable listing
- role filtering
- domain filtering
- difficulty filtering

DO NOT:
- create public comment systems
- create public engagement systems

---

# Reusability Rules

Users should be able to:
- duplicate templates
- modify duplicated versions
- reuse templates repeatedly

---

# State Design

Reuse existing:
- interview session state
- conversation state
- message rendering system

NO duplicate systems.

---

# Socket Design

NO new socket infrastructure required.

Reuse existing interview events.

Only add:
- template synchronization if necessary

Avoid excessive realtime complexity.

---

# UI Rules

Preserve:
- existing conversation architecture
- existing interview mode
- existing interview cards

This phase focuses on:
template ecosystem only.

---

# Mobile Rules

Ensure:
- template builder responsive
- dynamic question editor responsive
- filtering usable on mobile
- long template handling stable

---

# Scalability Requirements

Architecture must support future:
- template analytics
- AI-assisted improvements
- template recommendation systems
- scheduling integration

without large refactors.

---