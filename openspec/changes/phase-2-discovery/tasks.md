# Tasks - Phase 2: Discovery Feature

**Phase:** 2
**Status:** Planned
**Execution Order:** DB -> Backend -> Frontend -> Testing

---

## Layer 1: Database

- [x] `{ role: 1 }` index exists on User collection
- [x] `{ role: 1, status: 1, lastActiveAt: -1 }` compound index exists on User collection
- [x] No new indexes required for current discovery scope

> **No database changes needed for this phase.**

---

## Layer 2: Backend

- [x] `GET /api/discovery/roles` endpoint implemented (`discovery.service.searchRoleAggregates`)
- [x] `GET /api/discovery/role/:roleName` endpoint implemented (`discovery.service.getRoleSampleUsers`)
- [x] Input validation and sanitization implemented
- [x] Auth protection via `verifyJwt` middleware

> **No backend changes needed for current scope.**
> If caching is added (Redis/in-memory), add it here before frontend work.

---

## Layer 3: Frontend

### 3.1 - API Service Layer

- [ ] Create/verify `frontend/services/discoveryService.ts`
  - [ ] `searchRoles(query?: string): Promise<RoleAggregate[]>`
    - `GET /api/discovery/roles?q=<query>`
  - [ ] `getRoleDetail(roleName: string): Promise<RoleDetail>`
    - `GET /api/discovery/role/<roleName>`
- [ ] Add TypeScript interfaces:
  ```typescript
  interface RoleAggregate {
    role: string;
    totalUsers: number;
    activeUsers: number;
    waitingUsers: number;
  }
  interface RoleDetailUser {
    experience: string;
    dailyGoal: number;
    status: "waiting" | "matched";
  }
  interface RoleDetail {
    role: string;
    users: RoleDetailUser[];
  }
  ```

### 3.2 - Discovery Page

- [ ] Implement `frontend/app/discovery/page.tsx`
  - [ ] Build mobile-first layout (phone-first breakpoints, then desktop enhancements)
  - [ ] Search input with debounce (300ms)
  - [ ] On mount: load all roles (no query)
  - [ ] On input change: search roles with query
  - [ ] Display role cards with aggregate counts
  - [ ] On role card click: load and show role detail

### 3.3 - Role Card Component

- [ ] Create `frontend/features/discovery/RoleCard.tsx`
  - [ ] Props: `role`, `totalUsers`, `activeUsers`, `waitingUsers`
  - [ ] Show active badge (color-coded: green if activeUsers > 0)
  - [ ] Ensure touch-friendly tap targets and spacing on small screens
  - [ ] Clickable -> triggers role detail view

### 3.4 - Role Detail Component

- [ ] Create `frontend/features/discovery/RoleDetail.tsx`
  - [ ] Props: `roleDetail: RoleDetail`
  - [ ] Display sample users (experience, dailyGoal, status)
  - [ ] Use mobile-safe detail surface (sheet/full-screen/stacked) not desktop-only modal
  - [ ] CTA: "Find partners for this role" -> navigates to match flow

### 3.5 - State Management

- [ ] Integrate with existing store (TODO: verify store structure in `frontend/store/`)
  - [ ] `discoveryRoles: RoleAggregate[]`
  - [ ] `selectedRoleDetail: RoleDetail | null`
  - [ ] `isLoadingRoles: boolean`
  - [ ] `isLoadingDetail: boolean`

---

## Layer 4: Testing

### 4.1 - Backend Smoke Tests

- [x] `backend/scripts/discovery-smoke.mjs` exists (verify coverage)
- [ ] Verify smoke test covers:
  - [ ] `GET /api/discovery/roles` (no query)
  - [ ] `GET /api/discovery/roles?q=Frontend`
  - [ ] `GET /api/discovery/role/Frontend%20Engineer`
  - [ ] `GET /api/discovery/roles?q=<xss_attempt>` -> expects 400

### 4.2 - Frontend Integration

- [ ] Verify discovery page loads without errors
- [ ] Verify role search triggers correct API call
- [ ] Verify role detail modal/panel opens on click
- [ ] Verify empty state when no roles found
- [ ] Verify loading states during API calls
- [ ] Verify responsive behavior on common phone widths (320px, 375px, 390px)
- [ ] Verify touch interactions for search, cards, and detail CTA
- [ ] Verify layout is compatible with future PWA shell embedding (no clipped or blocked primary actions)

---

## Dependencies

| Task               | Depends On          |
|--------------------|---------------------|
| 3.2 Discovery Page | 3.1 Service Layer   |
| 3.3 Role Card      | (standalone)        |
| 3.4 Role Detail    | 3.1 Service Layer   |
| 3.5 State          | 3.1, 3.3, 3.4       |
| 4.2 Frontend Tests | 3.2, 3.3, 3.4, 3.5  |
