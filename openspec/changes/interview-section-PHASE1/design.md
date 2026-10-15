# Interview System Phase 1 Design

# Architecture Philosophy

RoleBuddy conversations are persistent preparation relationships.

Features like:
- chat
- exchange
- interviews
- future scheduling

must coexist inside same conversation system.

Interview is a structured interaction layer, NOT a standalone subsystem.

---

# High-Level Architecture

Conversation
├── Messages
├── ExchangeSession
└── InterviewSession

---

# Backend Design

## InterviewSession

Purpose:
Controls interview lifecycle and state.

Fields:
- conversationId
- interviewerId
- candidateId
- templateId
- status
- mode
- currentQuestionIndex
- totalQuestions
- finalRatings
- overallFeedback
- startedAt
- endedAt

Status values:
- pending
- active
- paused
- completed
- cancelled

---

## InterviewTemplate

Purpose:
Stores predefined structured interview flows.

Fields:
- title
- domain
- role
- type
- difficulty
- estimatedDuration
- questions[]

Question structure:
- question
- type
- followUps
- expectedTopics

---

# Message System Design

Existing message system extended with:

- interview_request
- interview_system
- interview_question
- interview_answer
- interview_feedback

Messages remain part of same conversation timeline.

---

# Frontend Design

## Conversation Layout

DO NOT replace existing conversation page.

Preserve:
- normal chat
- message history
- scrolling
- pagination
- socket connection

---

# Interview UI Additions

## Top Banner

Displays:
- active interview state
- progress
- role
- exit interview mode button

---

## Interview Sidebar

Opened from:
Start Interview button

Contains:
- type selection
- template selection
- role selection
- request action

Sidebar should visually align with existing exchange sidebar.

---

# Interview Cards

Separate reusable components required:

- InterviewRequestCard
- InterviewQuestionCard
- InterviewAnswerCard
- InterviewFeedbackCard
- InterviewSystemCard

DO NOT render interview events as plain text.

---

# State Design

## Backend State

InterviewSession controls persistent lifecycle.

---

## Frontend State

Interview mode is ONLY UI state.

Example:
showInterviewMode = true

This controls:
- visibility of interview controls
- visibility of banner
- helper actions

Conversation itself never changes.

---

# Socket Design

Reuse:
conversation:<conversationId>

Add events:
- interview_started
- interview_question_sent
- interview_answer_submitted
- interview_feedback_added
- interview_completed

DO NOT:
- create new namespaces
- create new socket systems
- duplicate realtime architecture

---

# UX Rules

Users MUST:
- continue normal messaging
- switch between chat and interview naturally
- preserve conversation continuity

Interview must feel like:
structured collaboration

NOT:
separate application navigation.

---

# Mobile Design

Ensure:
- responsive cards
- responsive sidebar
- long answer handling
- proper scrolling behavior

---

# Scalability Requirements

Architecture must safely support future:
- custom templates
- community templates
- scheduling
- meeting links
- analytics

without conversation refactors.

---