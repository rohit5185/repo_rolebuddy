# Interview System Phase 3 Tasks

# Backend

## Meeting Models

- [ ] Create InterviewMeetingSession model
- [ ] Add meeting lifecycle validation
- [ ] Add provider abstraction support
- [ ] Add meeting status handling

---

## Meeting Providers

- [ ] Add Google Meet provider integration structure
- [ ] Add Jitsi provider integration structure
- [ ] Add provider selection support
- [ ] Add meeting link generation flow

---

## APIs

- [ ] Create schedule interview API
- [ ] Create accept schedule request API
- [ ] Create decline schedule request API
- [ ] Create cancel meeting API
- [ ] Create fetch scheduled meetings API

---

## Message System

- [ ] Add interview scheduling message types
- [ ] Add meeting card payload support
- [ ] Preserve existing interview message compatibility

---

## Socket.IO

- [ ] Add meeting scheduling events
- [ ] Reuse existing conversation socket rooms
- [ ] Preserve interview realtime stability
- [ ] Preserve exchange realtime stability

---

# Frontend

## Conversation UI

- [ ] Add Schedule Live Interview button
- [ ] Preserve existing interview/chat layout
- [ ] Preserve exchange feature behavior

---

## Scheduling Flow

- [ ] Create scheduling sidebar/modal
- [ ] Add date selection
- [ ] Add time selection
- [ ] Add duration selection
- [ ] Add provider selection
- [ ] Add scheduling request flow

---

## Meeting Cards

- [ ] Create InterviewScheduleRequestCard
- [ ] Create InterviewMeetingCard
- [ ] Create InterviewScheduleSystemCard
- [ ] Add join meeting actions

---

## Meeting Lifecycle

- [ ] Add accept scheduling flow
- [ ] Add rescedule/change slot accordingly so that both are available at that time flow
- [ ] Add decline scheduling flow
- [ ] Add cancel meeting flow
- [ ] Add completed meeting state

---

## State Management

- [ ] Add meeting scheduling state
- [ ] Add realtime meeting synchronization
- [ ] Preserve interview state stability

---

# UX + UI

- [ ] Preserve conversation continuity
- [ ] Preserve interview continuity
- [ ] Preserve responsive mobile behavior
- [ ] Preserve mixed timeline rendering

---

# QA

- [ ] Verify Phase 1 still works
- [ ] Verify Phase 2 still works
- [ ] Verify exchange feature still works
- [ ] Verify meeting scheduling works
- [ ] Verify meeting links render correctly
- [ ] Verify realtime scheduling updates work
- [ ] Verify mobile scheduling flow works

---

# Completion Criteria

- [ ] Users can schedule live interviews
- [ ] Meeting requests appear inside conversations
- [ ] Users can join meetings from conversation timeline
- [ ] Existing interview system remains stable
- [ ] Existing exchange system remains stable

---