Break implementation into tasks.

---

# Backend

## Matching

* [ ] Extract match.engine module
* [ ] Remove duplicate scoring logic
* [ ] Implement symmetric match assignment
* [ ] Add transaction support

## Visibility

* [ ] Create visibility.service
* [ ] Implement relation state function
* [ ] Integrate across match + discovery

## Discovery

* [ ] Refactor suggestions to use matcher
* [ ] Apply visibility filtering
* [ ] Fix active user filtering

## Connection

* [ ] Fix bidirectional pending logic
* [ ] Prevent duplicate requests
* [ ] (Optional) migrate to dedicated collection

## Chat

* [ ] Auto-create conversation on match
* [ ] Auto-create on accept
* [ ] Ensure access consistency

---

# OpenSpec

* [ ] Update architecture.md
* [ ] Update database-schema.md (if changed)
* [ ] Update api-reference.md (if needed)

---

# Testing

* [ ] symmetric match validation
* [ ] exclusion matrix
* [ ] discovery correctness
* [ ] accept → chat flow
* [ ] duplicate prevention

---

# Deployment

* [ ] data cleanup script
* [ ] rollback plan
