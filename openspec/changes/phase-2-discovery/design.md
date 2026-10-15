# Design — Phase 2: Discovery Feature

**Phase:** 2
**Status:** Planned

---

## Backend API (Already Implemented)

The backend endpoints are fully implemented. No new backend changes required for the core discovery flow.

### Existing Endpoints

#### `GET /api/discovery/roles`

Aggregates all users by role. Returns role counts.

**Query:**
- `q` (optional): search string, max 50 chars, safe chars only

**Aggregation Pipeline:**
1. `$match` — `onboardingCompleted: true`, `role` exists and is non-empty string
2. `$project` — normalizes role to lowercase for grouping
3. `$match` — filters by query if provided (case-insensitive regex)
4. `$group` — groups by normalized role, computes `totalUsers`, `activeUsers` (last 24h), `waitingUsers`
5. `$sort` — `totalUsers DESC, role ASC`
6. `$limit` — 25 results

**Response shape:**
```json
[
  { "role": "Frontend Engineer", "totalUsers": 42, "activeUsers": 18, "waitingUsers": 10 }
]
```

#### `GET /api/discovery/role/:roleName`

Returns sample users for a specific role.

**Query:**
- Exact match (case-insensitive) on `role` field
- Returns max 10 users, sorted by `lastActiveAt DESC, createdAt DESC`
- Fields: `experience`, `dailyGoal`, `status` (no PII)

**Response shape:**
```json
{
  "role": "Frontend Engineer",
  "users": [
    { "experience": "junior", "dailyGoal": 2, "status": "waiting" }
  ]
}
```

---

## DB Usage

No new collections or indexes required for discovery.

**Indexes already in place that support discovery queries:**
- `{ role: 1 }` — role lookup
- `{ role: 1, status: 1, lastActiveAt: -1 }` — compound for active role queries

---

## Frontend Design

### Page: `/discovery`

**Route file:** `frontend/app/discovery/page.tsx` (exists, content TBD)

### Mobile + PWA UX Requirements

- Discovery UI must be mobile-responsive first, then enhanced for larger screens.
- Search, role cards, and role detail interactions must work with touch targets on phone screens.
- Role detail should support a mobile-safe presentation (sheet, full-screen panel, or stacked section) instead of desktop-only modal assumptions.
- Avoid hover-only affordances for discovery actions.
- Keep structure compatible with future PWA shell usage (stable layout regions, no viewport-breaking fixed elements).

**UI Flow:**
```
Discovery Page
├── Search Input (role query)
│     └── debounced → GET /api/discovery/roles?q=<input>
├── Role Cards List
│     ├── Role name
│     ├── Total users badge
│     ├── Active users (last 24h) badge
│     ├── Waiting users badge
│     └── Click → Role Detail Modal/Panel
└── Role Detail Modal
      ├── Role name header
      ├── Sample users grid (experience, dailyGoal, status)
      └── "Find partners for this role" CTA → triggers match flow
```

### Frontend Service Call

```typescript
// GET /api/discovery/roles?q=frontend
const roles = await discoveryService.searchRoles("frontend");

// GET /api/discovery/role/Frontend%20Engineer
const detail = await discoveryService.getRoleDetail("Frontend Engineer");
```

---

## Aggregation Logic

The discovery service uses MongoDB aggregation for role counts:

```javascript
// Active window: last 24 hours
const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

// Computed per role:
activeUsers = count where lastActiveAt >= recentThreshold
waitingUsers = count where status === "waiting"
totalUsers = count of all users with that role who completed onboarding
```

---

## Security Considerations

- All discovery routes require auth (`verifyJwt`)
- No PII exposed: role detail returns only `experience`, `dailyGoal`, `status`
- Input sanitized: safe text regex, max length enforced
- Regex escaped before DB query to prevent injection

---

## Known Constraints

- `DEFAULT_ROLE_LIMIT = 25` — max roles returned per search
- `MAX_SAMPLE_USERS = 10` — max users per role detail
- `MAX_QUERY_LENGTH = 50` — max search query length
- `ACTIVE_WINDOW_HOURS = 24` — active user definition
