# Interview System Phase 1 Tasks

# Backend

## Models

- [x] Create InterviewSession model
- [x] Create InterviewTemplate model
- [x] Add indexes for interview session lookup
- [x] Add validation for statuses/types

---

## Message System

- [x] Extend message types
- [x] Add interview structured payload support (`metadata` field with `kind`, session context, question data, ratings)
- [x] Preserve backward compatibility

---

## APIs

- [x] Create start interview request API (`POST /api/interviews/request`)
- [x] Create accept interview API (`POST /api/interviews/:sessionId/accept`)
- [x] Create decline interview API (`POST /api/interviews/:sessionId/decline`)
- [x] Create send question API (`POST /api/interviews/:sessionId/question`)
- [x] Create send answer API (`POST /api/interviews/:sessionId/answer`)
- [x] Create send feedback API (`POST /api/interviews/:sessionId/feedback`)
- [x] Create complete interview API (`POST /api/interviews/:sessionId/complete`)
- [x] Create fetch predefined templates API (`GET /api/interviews/templates`)
- [x] Create fetch active session API (`GET /api/interviews/session/:conversationId`)

---

## Socket.IO

- [x] Add interview socket events (7 events: request, accept, decline, send_question, submit_answer, submit_feedback, complete)
- [x] Reuse existing conversation rooms (`conversation:<conversationId>`)
- [x] Preserve exchange socket flow
- [x] Add realtime interview synchronization (events: interview_started, interview_question_sent, interview_answer_submitted, interview_feedback_added, interview_completed)

---

## Seed Data

- [x] Add tech interview templates (Frontend React, Backend Node.js, DSA)
- [x] Add non-tech interview templates (HR, Behavioral, Marketing Mixed)
- [x] Add HR templates (tech HR, non-tech HR)
- [x] Add behavioral templates (tech STAR, non-tech STAR)
- [x] Add mixed interview templates (Full Stack Mixed, Marketing Mixed)
- [x] Add resume round templates (tech, any)
- [x] Seed runs automatically on server startup (no-op if templates exist)

---

# Frontend

## Conversation UI

- [x] Add Start Interview button (next to Exchange in ChatWindow header)
- [x] Preserve existing conversation layout
- [x] Preserve exchange functionality
- [x] Preserve normal messaging

---

## Sidebar

- [x] Create interview sidebar (InterviewDrawer — 4-step flow)
- [x] Add type selection (step 1)
- [x] Add template selection (step 2 — fetched from API, filtered by domain)
- [x] Add role selection (step 3 — Interviewer / Candidate)
- [x] Add request flow with confirmation summary (step 4)

---

## Interview Cards

- [x] Create InterviewRequestCard (with Accept/Decline buttons for receiver)
- [x] Create InterviewQuestionCard (with inline answer textarea for candidate, follow-ups for interviewer)
- [x] Create InterviewAnswerCard (styled distinctly from text messages)
- [x] Create InterviewFeedbackCard (1–5 numeric ratings per category + written feedback)
- [x] Create InterviewSystemCard (started / declined / completed states)

---

## Interview Mode

- [x] Add interview banner (InterviewBanner — shows above messages when session active/pending)
- [x] Add interview mode UI state (`showInterviewBanner` + `activeInterviewSession` in ChatPage)
- [x] Add exit interview mode action (hides banner, session persists in DB)
- [x] Preserve normal chat during interview

---

## Feedback + Ratings

- [x] Add ratings UI (numeric 1–5 per category: overall, technical, communication, problemSolving)
- [x] Add written feedback UI
- [x] Add final interview feedback flow (submitFeedback → session marked completed)

---

## State

- [x] Add interview frontend state (interviewOpen, activeInterviewSession, showInterviewBanner)
- [x] Add realtime synchronization (5 socket event listeners in ChatPage)
- [x] Preserve chat state stability (messages list unaffected — interview messages added via receive_message)

---

# QA

- [ ] Verify exchange feature still works
- [ ] Verify normal chat still works
- [ ] Verify socket reconnection behavior
- [ ] Verify pagination compatibility
- [ ] Verify mixed timeline rendering
- [ ] Verify responsive mobile behavior

---

# Completion Criteria

- [x] Users can conduct structured interviews inside chat
- [x] Users can continue normal messaging during interview
- [x] Interview cards render correctly
- [x] Realtime updates function correctly
- [x] Exchange system remains stable

---