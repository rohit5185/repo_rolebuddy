# Tasks — Exchange UX Overhaul

## Phase A — Backend Changes

- [x] Add exchange accepted notification system message in `acceptExchangeRequest()`
- [x] Add `trimOrNull` utility function
- [x] Create `shareSensitiveInfo()` service function (ephemeral, posts to chat)
- [x] Add `shareSensitiveEntry` controller
- [x] Add `POST /api/exchanges/:exchangeId/share-sensitive` route
- [ ] Update OpenAPI spec / api-reference.md (if OpenAPI yaml exists)

---

## Phase B — Frontend: Dropdown Components

- [x] Create `SelectField` component (styled `<select>`)
- [x] Create `RolePickerField` component (dropdown + "Other" free text)
- [x] Create `SkillsPickerField` component (dropdown + comma tags)
- [x] Add curated roles list (tech + non-tech)
- [x] Add curated skills list
- [x] Add ROUND_NUMBERS and ROLE_DIFFICULTY constants

---

## Phase C — Frontend: Template Form Redesign

- [x] Split ExchangeDrawer templates into separate Interview/Role sections
- [x] Add individual edit buttons for each template
- [x] Add individual save buttons for each template
- [x] Replace role text input with RolePickerField dropdown (Interview template)
- [x] Replace role text input with RolePickerField dropdown (Role template)
- [x] Replace Number of Rounds with SelectField dropdown (1-5, Other)
- [x] Make Round Types dynamic placeholder based on round count
- [x] Replace Interview Date text input with HTML date picker
- [x] Replace Company Type chips with SelectField dropdown (both templates)
- [x] Replace Skills Required text with SkillsPickerField (Role template)
- [x] Replace Most Important Skills text with SkillsPickerField (Role template)
- [x] Replace Difficulty of Entering Role with SelectField dropdown

---

## Phase D — Frontend: Content Simplification

- [x] Remove verbose info banner text from exchange drawer
- [x] Remove "Mark exchange completed" section and explanation
- [x] Reduce helper text to concise messages
- [x] Remove `onComplete` prop from ExchangeDrawer
- [x] Remove `handleCompleteExchange` from ChatPage
- [x] Remove `completeExchange` import from ChatPage

---

## Phase E — Frontend: Chat Template Display

- [x] Own template messages → collapsed "Your template was shared" notice
- [x] Partner template messages → full styled colored card
- [x] Add colored gradient borders (purple for interview, teal for role)
- [x] Improve field label typography in template cards (bold labels)
- [x] Add exchange accepted notification card rendering
- [x] Add sensitive template message rendering in chat

---

## Phase F — Frontend: Sensitive Info Sharing

- [x] Add sensitive info form state variables in ExchangeDrawer
- [x] Add sensitive info form UI (ephemeral, real-time entry)
- [x] Add `shareSensitiveInfo()` function in chat.api.ts
- [x] Add `SensitiveTemplate` type in types.ts
- [x] Add `handleShareSensitive` in ChatPage
- [x] Wire form submit to new backend endpoint
- [x] Reset form after successful share
- [x] Add `onShareSensitive` prop to ExchangeDrawer

---

## Phase G — OpenSpec Updates

- [x] Create openspec/changes/exchange-ux-overhaul/proposal.md
- [x] Create openspec/changes/exchange-ux-overhaul/design.md
- [x] Create openspec/changes/exchange-ux-overhaul/tasks.md
- [x] Update api-reference.md with new endpoint
- [x] Update api-reference.md to note `complete` endpoint is UI-hidden

---

## Phase H — Testing & Verification

- [x] Run frontend build (`npm run build`) — no TypeScript errors
- [ ] Verify exchange drawer opens correctly
- [ ] Verify all dropdown interactions
- [ ] Verify separate template editing (interview/role independently)
- [ ] Verify date picker calendar display
- [ ] Verify sensitive info sharing flow end-to-end
- [ ] Verify template display in chat (own vs partner)
- [ ] Verify "Mark complete" button is removed
- [ ] Verify exchange accepted notification shows in chat
