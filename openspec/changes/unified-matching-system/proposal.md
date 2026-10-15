Create a proposal for refactoring the RoleBuddy matching system.

---

# Title

Unified Matching & Visibility System

---

# Problem

Current system has inconsistencies:

* Match is one-sided (A → B but not B → A)
* Discovery uses different logic than matching
* Pending/connected users appear incorrectly in suggestions
* No unified rule for "who should be visible"
* Chat is not lifecycle-driven (not auto-ready)

This breaks core product expectation:
Users should reliably find others preparing for the same role.

---

# Proposed Solution

Introduce:

1. Symmetric Match Assignment
2. Shared Matching Engine (used by match + discovery)
3. Visibility/Relation Engine (single source of truth)
4. Canonical Candidate Filtering
5. Lifecycle-based Chat Initialization

---

# Impact

Positive:

* Consistent user experience
* Accurate suggestions
* No duplicate or stale states
* Better scalability for future ranking systems

Breaking Changes:

* Match behavior changes from one-sided → two-sided
* Discovery ranking logic changes
* Connection flow triggers chat creation

---

# Scope

Includes:

* match service refactor
* connection service refactor
* discovery unification
* chat lifecycle updates

Excludes:

* AI recommendations
* gamification
* notifications

---

# Decision

Approved for Phase 2 system stabilization.
