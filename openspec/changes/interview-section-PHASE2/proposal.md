# Interview System Phase 2 Proposal

## Overview

Phase 2 evolves the interview system from:
- predefined system interview templates

into:
- reusable community-powered interview preparation flows.

Users can now:
- create custom interview templates
- save reusable interview sets
- manage interview structures
- share templates publicly or privately
- reuse templates with connected peers

This phase transforms interviews into a scalable preparation ecosystem.

---

# Goals

- Enable user-created interview templates
- Enable reusable structured interview sets
- Support BOTH tech and non-tech interview flows
- Preserve existing interview architecture from Phase 1
- Preserve conversation-based interview experience
- Add scalable template management system
- Enable public/private interview template visibility

---

# Non-Goals (Phase 2)

NOT included:
- video interviews
- scheduling
- Google Meet integration
- Jitsi integration
- AI scoring
- AI template generation
- analytics dashboards
- public rating systems

---

# Product Philosophy

Interview templates are preparation frameworks.

Users should be able to:
- simulate real interview rounds
- build role-specific flows
- reuse structured preparation systems

without turning RoleBuddy into:
- a social content platform
- a public forum
- an interview marketplace

---

# Template Types

Phase 2 supports:

## System Templates
Created by RoleBuddy.

Examples:
- Node.js Beginner
- HR Fresher Round
- Marketing Campaign Round

---

## User Templates

Created by users.

Examples:
- MERN Backend Deep Dive
- Finance Analyst Screening
- Product Design Round
- Sales Discovery Call Practice

---

# Visibility Modes

Templates support:

- private
- public

---

# Private Templates

Visible only to creator.

Used for:
- personal preparation
- custom role practice
- peer-specific interview flows

---

# Public Templates

Visible to other RoleBuddy users.

Used for:
- reusable community interview preparation
- shared learning structures
- role-specific interview practice

---

# Template Creation Flow

Users can:
- create template title
- select domain
- select role
- select interview type
- select difficulty
- add structured questions
- add follow-up questions
- save template

---

# Interview Integration

Phase 2 MUST preserve Phase 1 architecture.

Interviews still:
- happen inside conversations
- use same message system
- use same Socket.IO rooms
- use same interview cards

NO architecture rewrite allowed.

---

# Discovery Rules

Public templates should be filterable by:
- domain
- role
- type
- difficulty

Examples:
- HR
- Backend
- Marketing
- Behavioral
- Beginner

---

# Template Management

Users can:
- create
- edit
- delete
- duplicate
- reuse

their templates.

---

# UX Rules

DO NOT:
- create separate social feed
- create template comments
- create template likes
- create follower systems

This is NOT social media.

---

# Future Compatibility

Architecture must support future:
- template ratings
- template analytics
- AI-assisted templates
- live interview scheduling
- role-based recommendations

without major refactors.

--- 