# Interview System Phase 3 Proposal

## Overview

Phase 3 introduces live interview scheduling capabilities into the existing RoleBuddy interview ecosystem.

Users can:
- schedule live mock interviews
- generate meeting links
- attach meetings to existing conversations
- simulate real interview experiences

This phase extends the structured interview preparation flow into real-time live interview coordination.

---

# Goals

- Enable live interview scheduling
- Integrate meeting links into conversations
- Preserve conversation-centric architecture
- Support lightweight meeting integrations
- Preserve existing interview/chat systems
- Avoid custom video infrastructure complexity

---

# Non-Goals (Phase 3)

NOT included:
- custom WebRTC implementation
- separate video platform
- video recording
- screen recording
- live transcription
- AI interview analysis
- meeting moderation systems

---

# Product Philosophy

RoleBuddy is NOT becoming:
- Zoom
- Google Meet
- Discord

RoleBuddy remains:
- a role-based preparation system

Live interviews are:
- preparation coordination layers
- attached to existing preparation relationships

---

# Meeting Strategy

Phase 3 uses:
- external meeting providers
- lightweight scheduling integration

Preferred integrations:
- Google Meet
- Jitsi Meet

NO custom video infrastructure.

---

# Scheduling Flow

## Step 1

User opens existing conversation.

## Step 2

User clicks:
Schedule Live Interview

---

## Step 3

Scheduling sidebar/modal opens.

User selects:
- date
- time
- duration
- interview type
- template (optional)

---

## Step 4

Meeting request card inserted into conversation.

Other user:
- accepts
- declines

---

## Step 5

Meeting link generated.

Meeting card appears inside conversation.

Users join from same conversation thread.

---

# Conversation Rules

Live interview scheduling MUST preserve:
- existing chat
- existing interview system
- existing exchange system

Meeting coordination remains inside same timeline.

---

# Meeting Link Rules

Meeting links should:
- appear as structured cards
- remain attached to interview sessions
- support meeting lifecycle states

---

# Supported Meeting Providers

Phase 3 architecture must support:
- Google Meet
- Jitsi Meet

with provider abstraction.

---

# Scheduling States

Meeting lifecycle:
- pending
- accepted
- declined
- scheduled
- completed
- expired
- cancelled

---

# Future Compatibility

Architecture must support future:
- calendar sync
- reminders
- timezone handling
- recurring sessions
- AI scheduling assistance

without major refactors.

---