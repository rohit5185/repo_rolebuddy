# Design — Exchange UX Overhaul

## Architecture Overview

This change modifies the exchange feature's frontend presentation and adds one backend endpoint. No database schema changes.

---

## Changes by Layer

### Backend

**Exchange Service** — 2 modifications:
1. `acceptExchangeRequest()`: Add system message notification before templates
2. New `shareSensitiveInfo()`: Posts ephemeral sensitive template to chat without saving to profile

**Exchange Controller** — 1 addition:
- `shareSensitiveEntry`: Controller for new sensitive sharing endpoint

**Exchange Routes** — 1 addition:
- `POST /api/exchanges/:exchangeId/share-sensitive`

---

### Frontend

**ExchangeDrawer.tsx** — Major rewrite:
- Split into separate interview/role template sections
- Replace text inputs with dropdowns (SelectDropdown, RolePicker, SkillsPicker)
- Add date picker for interview date
- Simplify all content text
- Remove "Mark exchange completed" section
- Add ephemeral sensitive info form (shown only when sensitive layer unlocked)

**MessageBubble.tsx** — Template display logic:
- Own template → collapsed "shared" notice
- Partner template → full styled colored card

**exchangeTemplatePreview.tsx** — Add styled chat variant:
- Colored gradient backgrounds
- Icons for template types
- Better field label typography

**ChatPage.tsx** — Remove complete exchange handler:
- Remove `handleCompleteExchange`, `completeExchange` import
- Remove `onComplete` prop

**chat.api.ts** — Add API function:
- `shareSensitiveInfo(exchangeId, template)`

**types.ts** — Add type:
- `SensitiveTemplate` type for ephemeral sensitive sharing

---

## New UI Components (in ExchangeDrawer.tsx)

### SelectDropdown
Styled `<select>` with RoleBuddy design tokens. Props: `label`, `options`, `value`, `onChange`, `placeholder`.

### RolePicker
Dropdown with curated roles + "Other (enter manually)". When "Other" selected, shows text input.

### SkillsPicker
Dropdown with curated skills. Selected skills appear as comma-separated text. Can add custom skills.

---

## Sensitive Sharing Flow (Redesigned)

```
1. Both users approve sensitive unlock (existing mutual approval)
2. User clicks "Share Sensitive Info" in exchange drawer
3. Form appears (HR contact, recruiter details, referral paths, etc.)
4. User fills form in real-time (nothing saved to profile)
5. User clicks "Share" → POST /api/exchanges/:exchangeId/share-sensitive
6. Backend validates sensitive layer is unlocked
7. Backend posts formatted system message in chat with template data
8. Frontend receives message via Socket.IO, displays styled card in chat
9. Form resets. Template data NOT persisted in exchangeProfile.
```

---

## Feature Structure

No new feature directories. Changes are within existing:
```
backend/src/features/exchange/
frontend/features/chat/
```
