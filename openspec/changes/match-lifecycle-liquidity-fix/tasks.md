# Implementation Tasks

## Database

* [ ] Add `activeMatchExpiresAt` field to User schema
* [ ] Add `lastMatchAt` field to User schema
* [ ] Add index for expiry checks

---

## Matching Service

* [ ] Implement `checkAndExpireMatch(userId)`
* [ ] Update match eligibility logic
* [ ] Update match creation to include expiry

---

## Rematch Feature

* [ ] Implement `rematchUser(userId)`
* [ ] Add cooldown validation (24h)
* [ ] Create controller and route (`POST /api/match/rematch`)

---

## Dashboard Integration

* [ ] Call expiry check before returning dashboard data

---

## Discovery Update

* [ ] Remove status-based filtering
* [ ] Ensure all active users are included

---

## Testing

* [ ] Match expires after 48h
* [ ] Users re-enter pool correctly
* [ ] Rematch works with cooldown
* [ ] No duplicate matches
* [ ] No user gets stuck without options

---

## Documentation (Post Implementation)

* [ ] Update `database-schema.md`
* [ ] Update `architecture.md`
* [ ] Update `api-reference.md`
