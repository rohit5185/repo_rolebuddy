Document the design for the Unified Matching System.

---

# 1. Core Concept

Introduce a shared system composed of:

* Matching Engine
* Visibility Engine
* Unified Candidate Filtering

---

# 2. Matching Engine

Responsibilities:

* Generate ranked candidates
* Calculate match score
* Apply hierarchical relaxation

Used by:

* Auto Match
* Discovery Suggestions
* Search (optional)

---

# 3. Visibility Engine

Function:
getUserRelationState(currentUser, targetUser)

Returns:

* state (matched, connected, pending_sent, pending_received, available, hidden)
* visibility boolean

Purpose:
Single source of truth for:
"Should this user be shown?"

---

# 4. Symmetric Matching

Match assignment must:

* update both users atomically
* enforce 1:1 constraint
* prevent race conditions

---

# 5. Candidate Filtering

Global rules:

* exclude self
* onboardingCompleted = true
* active within 24h
* status = waiting
* matchedUserId = null
* not connected
* no pending relation (both directions)

---

# 6. Discovery Flow

* uses same matcher
* filters via visibility engine
* sorted by matchScore

---

# 7. Chat Lifecycle

* conversation created:

  * on match
  * on connection accept
* chat always immediately available

---

# 8. Data Model Changes (if applied)

Optionally introduce:
ConnectionRequest collection

---

# 9. Backward Compatibility

* Existing APIs preserved
* Behavior updated internally

---

# 10. Risks

* race conditions in matching
* inconsistent legacy data
* need migration for existing users

---

# 11. Migration Plan

* clean invalid matches
* rebuild match state if needed
* ensure connection consistency
