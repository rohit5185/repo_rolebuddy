# Interview System Phase 1 Proposal

## Overview

Introduce a structured peer-to-peer mock interview system inside existing RoleBuddy conversations.

The interview system extends the current chat + exchange architecture and allows connected/matched users to conduct structured mock interviews without leaving the conversation experience.

This feature supports BOTH:
- tech roles
- non-tech roles

using existing onboarding domain/role structure.

---

# Goals

- Enable structured mock interviews inside conversations
- Preserve normal chat functionality
- Preserve exchange feature compatibility
- Reuse existing Socket.IO architecture
- Support predefined interview templates
- Support human-based peer feedback/rating
- Keep architecture scalable for future phases

---

# Non-Goals (Phase 1)

NOT included:
- custom user-created templates
- AI scoring/evaluation
- video interviews
- Google Meet integration
- Jitsi integration
- scheduling system
- analytics dashboards

---

# Product Philosophy

Interview is NOT:
- a separate application
- a separate chat system
- a separate realtime infrastructure

Interview IS:
- a structured activity layer inside persistent conversations

Conversation remains the foundation.

---

# UX Flow

## Start Flow

User opens existing conversation.

New button added near Exchange:
- Start Interview

Clicking opens interview sidebar.

---

## Sidebar Flow

User selects:
- interview type
- predefined template
- interviewer/candidate role

Then sends interview request.

---

## Request Flow

Structured interview request card appears inside conversation timeline.

Other user:
- accepts
- declines

If accepted:
- InterviewSession becomes active
- interview mode UI becomes available

---

# Conversation Rules

Normal chat remains active during interview.

Users can:
- continue messaging
- discuss answers
- send normal text

Interview messages appear as structured cards inside timeline.

---

# Message Types

Add:
- interview_request
- interview_system
- interview_question
- interview_answer
- interview_feedback

These extend existing message renderer architecture.

---

# Backend Additions

New models:
- InterviewSession
- InterviewTemplate

InterviewSession controls:
- lifecycle
- progress
- ratings
- participants

InterviewTemplate stores:
- predefined interview structures
- role/domain-based questions

---

# Supported Interview Categories

Templates must support:
- technical
- HR
- behavioral
- mixed
- resume round

for BOTH:
- tech
- non-tech domains

---

# Socket Architecture

Reuse existing:
conversation:<conversationId>

NO new websocket infrastructure.

Only add lightweight interview events.

---

# UI Requirements

Must preserve:
- current conversation layout
- scroll behavior
- pagination behavior
- exchange feature

Interview mode only overlays:
- banner
- controls
- interview cards

---

# Future Compatibility

Phase 1 architecture must support future:
- custom templates
- community templates
- scheduling
- Google Meet
- Jitsi
- analytics

without major refactors.

---