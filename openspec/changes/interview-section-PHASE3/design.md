# Interview System Phase 3 Design

# Architecture Philosophy

Phase 3 extends existing interview infrastructure.

DO NOT:
- redesign conversations
- redesign interview architecture
- create separate meeting systems
- create standalone scheduling applications

Meetings are structured coordination events inside persistent conversations.

---

# High-Level Architecture

Conversation
├── Messages
├── ExchangeSession
├── InterviewSession
└── InterviewMeetingSession

---

# Backend Design

## InterviewMeetingSession

Purpose:
Controls scheduled live interview lifecycle.

Fields:
- conversationId
- interviewSessionId
- organizerId
- participantId
- provider
- meetingLink
- scheduledAt
- duration
- status
- notes
- createdAt

---

# Provider Support

Supported providers:
- google_meet
- jitsi

Provider architecture should remain extensible.

---

# Meeting Status Values

- pending
- accepted
- declined
- scheduled
- completed
- cancelled
- expired

---

# Message System Extensions

Add message types:

- interview_schedule_request
- interview_schedule_system
- interview_meeting_card

Messages remain inside same conversation timeline.

---

# Frontend Design

# Conversation Integration

DO NOT:
- redirect users to scheduling pages
- replace existing interview experience
- replace existing chat UI

Scheduling overlays existing conversation architecture.

---

# Scheduling UI

Add:
- Schedule Live Interview button
- scheduling sidebar/modal
- meeting cards
- join meeting actions

---

# Scheduling Flow UI

User selects:
- date
- time
- duration
- provider
- optional template

Then sends scheduling request.

---

# Meeting Cards

Create reusable components:

- InterviewScheduleRequestCard
- InterviewMeetingCard
- InterviewScheduleSystemCard

Meeting cards must:
- show status
- show timing
- show provider
- show join action

---

# Meeting Join Flow

Users join meetings directly from:
existing conversation timeline.

DO NOT:
- create separate meeting dashboards
- create external coordination flows

---

# State Design

Reuse:
- conversation state
- interview state
- message renderer architecture

Add:
meeting scheduling state only.

---

# Socket Design

Reuse:
conversation:<conversationId>

Add lightweight events:
- interview_schedule_requested
- interview_schedule_accepted
- interview_meeting_created
- interview_meeting_cancelled

NO new socket systems.

---

# Mobile Rules

Ensure:
- meeting cards responsive
- scheduling flow mobile friendly
- date/time selection stable
- join actions accessible

---

# Scalability Requirements

Architecture must support future:
- reminders
- timezone support
- calendar sync
- recurring meetings
- live session analytics

without major refactors.

---