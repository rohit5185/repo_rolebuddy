# Behavior Spec — Discovery Feature

**Feature:** Discovery (Role Search + Role Detail)
**Phase:** 2
**Format:** Given / When / Then

---

## Feature: Role Search

---

### Scenario 1: User searches for roles without a query

**Given** an authenticated user on the discovery page
**When** the page loads with no search query
**Then** the API returns up to 25 roles sorted by totalUsers DESC
**And** each role object includes `role`, `totalUsers`, `activeUsers`, `waitingUsers`
**And** no PII is exposed in the response

---

### Scenario 2: User searches for roles with a matching query

**Given** an authenticated user
**When** they submit `GET /api/discovery/roles?q=frontend`
**Then** the API returns roles matching "frontend" (case-insensitive)
**And** each matching role shows aggregate counts
**And** results are sorted by totalUsers DESC, then role ASC

---

### Scenario 3: User searches with a query that matches no roles

**Given** an authenticated user
**When** they submit `GET /api/discovery/roles?q=xyz_nonexistent_role_xyz`
**Then** the API returns an empty array `[]`
**And** the HTTP status is 200

---

### Scenario 4: User submits a query that is too long

**Given** an authenticated user
**When** they submit a query longer than 50 characters
**Then** the API returns a 400 error
**And** the response message is "Search query is too long."

---

### Scenario 5: User submits a query with invalid characters

**Given** an authenticated user
**When** they submit a query containing characters not in `[a-zA-Z0-9+\-_. ]`
**Then** the API returns a 400 error
**And** the response message is "Search query contains invalid characters."

---

### Scenario 6: Unauthenticated user attempts discovery

**Given** a user without a valid JWT token
**When** they attempt `GET /api/discovery/roles`
**Then** the API returns a 401 error
**And** the response message is "Authentication required."

---

## Feature: Role Detail

---

### Scenario 7: User views detail for an existing role

**Given** an authenticated user
**And** at least one user with `role: "Frontend Engineer"` and `onboardingCompleted: true` exists
**When** they call `GET /api/discovery/role/Frontend%20Engineer`
**Then** the API returns a 200 response
**And** the response includes `role: "Frontend Engineer"`
**And** the response includes a `users` array (max 10 items)
**And** each user object contains only `experience`, `dailyGoal`, `status`
**And** no email, _id, or other PII is returned

---

### Scenario 8: User views detail for a role with no users

**Given** an authenticated user
**When** they call `GET /api/discovery/role/SomeRoleWithNoUsers`
**Then** the API returns a 200 response
**And** the `users` array is empty `[]`

---

### Scenario 9: User submits an invalid role name

**Given** an authenticated user
**When** they call `GET /api/discovery/role/<empty or invalid chars>`
**Then** the API returns a 400 error
**And** the response message indicates the role name is invalid

---

### Scenario 10: Role detail results are sorted by recency

**Given** multiple users exist for the same role
**When** a user calls `GET /api/discovery/role/<roleName>`
**Then** the API returns users sorted by `lastActiveAt DESC`, then `createdAt DESC`
**And** the most recently active users appear first

---

## Feature: Active User Counts

---

### Scenario 11: Active user count reflects 24-hour window

**Given** users with the same role exist
**And** some users have `lastActiveAt` within the last 24 hours
**And** some users have `lastActiveAt` older than 24 hours
**When** a user calls `GET /api/discovery/roles`
**Then** `activeUsers` count reflects ONLY users active within the last 24 hours
**And** `totalUsers` reflects ALL onboarded users with that role

---

### Scenario 12: Waiting user count is accurate

**Given** users with the same role exist with mixed `status` values
**When** a user calls `GET /api/discovery/roles`
**Then** `waitingUsers` reflects only users with `status: "waiting"`
**And** matched users are excluded from `waitingUsers` count

---

## Feature: Responsive + PWA-Ready Discovery UI

### Scenario 13: Discovery page is usable on small mobile screens

**Given** an authenticated user opens `/discovery` on a common phone width (320px to 390px)
**When** role results are rendered
**Then** search, role cards, and role detail entry points are fully visible without layout breakage
**And** horizontal scrolling is not required for primary actions

---

### Scenario 14: Discovery interactions are touch-friendly

**Given** an authenticated user on a touch device
**When** they tap search, role cards, and CTA actions
**Then** all interactive controls are reachable and usable through touch
**And** no hover-only interaction is required to complete discovery flow

---

### Scenario 15: Discovery detail view supports mobile-safe presentation

**Given** an authenticated user selects a role on mobile
**When** role detail opens
**Then** detail content appears in a mobile-safe panel/sheet/full-screen section
**And** users can access "Find partners for this role" without viewport clipping
