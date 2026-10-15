# Proposal — Exchange System UX Overhaul

## Summary

Overhaul the Professional Experience Exchange System UX based on 7 user feedback points. This changes UI patterns, form inputs, template display, and sensitive sharing mechanics while preserving the core exchange architecture.

---

## Changes

### 1. Exchange Accepted Chat Notification

**Current:** When exchange is accepted, templates auto-post in chat but there is no visible notification.

**Proposed:** Post a system message in chat: "Exchange request accepted — templates have been shared." before the template messages.

---

### 2. Simplified Exchange Drawer Content

**Current:** Exchange drawer contains verbose explanatory text, info banners, and long descriptions.

**Proposed:** Strip all non-essential text. Keep only:
- Status indicators (pills/badges)
- Action buttons
- 1-line helper text where absolutely necessary
- Remove wordy paragraphs

---

### 3. Form UX — Dropdowns Over Text Inputs

**Current:** Template forms use text inputs and small chip buttons for most fields.

**Proposed:**
- **Role fields** → Dropdown with curated role list (tech + non-tech) + "Other (enter manually)" option
- **Number of rounds** → Dropdown: 1, 2, 3, 4, 5, Other
- **Round types** → Comma-separated text entry (dynamic based on round count)
- **Interview date** → Calendar date picker (dd/mm/yyyy)
- **Skills** → Dropdown picker with common skills, displayed as comma-separated tags
- **Company type** → Dropdown (currently chips)
- **Difficulty of entering role** → Dropdown (Easy, Moderate, Hard, Very Hard)
- Keep chips only for: Experience Level, Overall Difficulty (interview), Outcome

**Rationale:** Users prefer clicking over typing. Dropdowns are faster and reduce input errors.

---

### 4. Separate Interview & Role Experience Templates

**Current:** Both templates are edited together in one combined form with a single "Save templates" button.

**Proposed:**
- Two separate template sections: "Interview Experience" and "Role Experience"
- Each has its own edit button, save button, and preview card
- User can edit one independently without touching the other

**Database:** No schema changes. `exchangeProfile.roleTemplate` and `exchangeProfile.interviewTemplate` remain as-is.

---

### 5. Better Template Display in Chat

**Current:** Template messages show as plain black/white cards with all fields listed for both sender and receiver.

**Proposed:**
- **Own template:** Show collapsed message: "Your [type] template was shared with your partner"
- **Partner template:** Show full styled card with:
  - Colored gradient border (purple for interview, teal for role)
  - Icons (Briefcase for role, GraduationCap for interview)
  - Better typography (bold labels, styled values)
  - Premium, non-generic aesthetic

---

### 6. Sensitive Info Sharing — Real-Time, Ephemeral

**Current:** Sensitive sharing uses the ExchangeEntry system to persist data.

**Proposed:**
- Sensitive info template entered in **real-time** when sharing
- NOT saved to user profile — ephemeral, one-time only
- On submit → data posted directly to chat as a styled system message
- Both users must have mutually accepted sensitive unlock first (capability requirement preserved)
- Form resets after sharing

**New endpoint:** `POST /api/exchanges/:exchangeId/share-sensitive`

---

### 7. Remove "Mark Exchange Completed" Button

**Current:** Exchange drawer has a "Mark exchange completed" button with explanation text.

**Proposed:** Remove from UI entirely. Backend endpoint preserved but not exposed in frontend.

**Rationale:** Sensitive sharing security is handled by mutual approval. No need for manual completion step.

---

## Non-Goals

- No schema changes to Exchange or ExchangeEntry models
- No changes to trust/capability/verification engines
- No changes to matching or connection systems
- No new database collections
