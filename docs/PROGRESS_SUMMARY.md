# RoleBuddy — Progress Summary (as of 28 May 2026)

## What we do

RoleBuddy helps people preparing for tech roles stay consistent by pairing them with a peer for daily accountability. The product emphasizes low-friction, partner-driven habit formation: daily prompts, simple status sharing, and lightweight social pressure to keep users on track.

## Product — detailed feature list (your requested items)

- **Chat & Exchange:** Private messaging between connected or matched users; supports normal conversation and "exchange" sessions where users share structured experience notes.

- **Interview Experience Sharing (Exchange):** Users can share real interview experiences and notes inside the exchange flow so peers can learn from each other's outcomes.

- **Promote Connection → Match:** From a profile or connection list users can "promote" a connection into a timeboxed accountability match (the promote action and accept flow exist in the product).

- **Invites & Promotion Flow:** Users can send invitations (connection requests) and later promote an accepted connection to a formal accountability match via the profile UI.

- **Interview System (three modes):**
	- Async text-based interviews using templates: structured Q&A flows where one user sends questions and the other responds inline using reusable templates.
	- Live-online interviews (text format): a scheduling-backed live interview mode that runs inside the conversation (text-first live session when both participants are present).
	- Meeting scheduling / calendar invites: ability to propose/confirm meeting slots and create calendar events so participants get invites in their calendar apps.

- **Scheduling & Calendar Integration:** The product includes meeting scheduling primitives and Google Calendar integration hooks so confirmed slots can be added to calendars (users can connect their calendar accounts).

- **Streaks, Check-ins & Alerts:** Daily check-in prompts, streak tracking for consistent activity, and partner alerts when someone misses a goal.

## Status snapshot (implementation vs. roadmap)

- Chat & Exchange: Implemented and actively used.
- Async template interviews: Implemented (structured templates and in-chat interview flows available).
- Promote connection → match: Implemented (promote request + accept flow available in profile/connection UI).
- Interview experience sharing (exchange): Implemented as part of Exchange flows.
- Meeting scheduling and calendar invites: Partially implemented — backend scheduling APIs and calendar OAuth hooks exist; UI scheduling flows and polished invite UX are in Phase‑3 tasks.
- Live-online interview mode (text-based with confirmed slot): Backend lifecycle and scheduling guards implemented; complete end-to-end UX and mobile-friendly scheduling are still roadmap items.

## Typical end-to-end flows (what a user can do)

- Become connected with someone, then promote them to an accountability match.
- Start an async interview inside chat using a saved template and exchange structured Q/A.
- Propose a live interview slot; once confirmed, receive calendar invites (if calendar connected) and run a live text-based interview when both are present.

## Next focus (non-technical priorities you might want)

- Finish the scheduling UI (Schedule Live Interview modal, in-chat schedule cards).
- Polish calendar-invite UX so users can send invites directly from chat messages.
- Improve mobile/responsive scheduling and add lightweight reminders.

---
