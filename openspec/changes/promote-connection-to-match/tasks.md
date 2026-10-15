# Implementation Tasks

## Database

* [x] Add `pendingMatchRequests` to User schema
* [x] Add validation for request structure
* [x] Add index on `pendingMatchRequests.from`

---

## Promotion Request

* [x] Implement `sendPromotionRequest(userId, targetUserId)`
* [x] Validate users are connected
* [x] Prevent duplicate requests
* [x] Add request to target user

---

## Accept Promotion

* [x] Implement `acceptPromotionRequest(userId, fromUserId)`
* [x] Validate request exists
* [x] Break existing matches (both users)
* [x] Create new match
* [x] Remove request

---

## Match Integration

* [x] Reuse existing match creation logic
* [x] Ensure expiry + lifecycle logic applies

---

## Cooldown

* [x] Enforce 24h cooldown (reuse rematch logic)

---

## API Layer

* [x] Create controller for send request
* [x] Create controller for accept request
* [x] Add routes under `/api/match/`

---

## Edge Case Handling

* [x] Prevent self-promotion
* [x] Prevent promotion without connection
* [x] Handle concurrent requests safely

---

## Testing

* [ ] Request → accept → match created
* [ ] Existing matches are replaced correctly
* [ ] Cooldown enforced
* [ ] Duplicate request blocked
* [ ] Invalid accept rejected

---

## Documentation (Post Implementation)

* [x] Update `database-schema.md`
* [x] Update `architecture.md`
* [x] Update `api-reference.md`
