# API Reference - RoleBuddy (Phase 1)

Last updated: 2026-04-23
Base URL (default local): `http://localhost:5000/api`
Health endpoint: `GET http://localhost:5000/health`

## 1. Authentication
Protected routes require JWT via either:
- HttpOnly cookie: `accessToken`
- Header: `Authorization: Bearer <token>`

## 2. Conventions
Success (common pattern):
```json
{
  "message": "...",
  "data": { "...": "..." }
}
```

Error:
```json
{
  "message": "..."
}
```

## 3. Auth Endpoints

### POST `/auth/signup`
Create user account.

Request body:
```json
{
  "email": "user@example.com",
  "password": "minimum8chars"
}
```

Response: `201`
- Sets `accessToken` cookie
- Returns serialized user only

### POST `/auth/login`
Authenticate existing user.

Request body:
```json
{
  "email": "user@example.com",
  "password": "minimum8chars"
}
```

Response: `200`
- Sets `accessToken` cookie
- Returns serialized user only

## 4. User Endpoints

### GET `/user/profile` (auth)
Get authenticated user profile.

### PUT `/user/onboarding` (auth)
Complete/update onboarding.

Important fields:
- `domain`: `tech | non-tech`
- `role`, `experience`, `dailyGoal`
- `availabilityTime` and `availability`
- `skills[]`, `goal`, `preferences[]`
- `primaryArea` (tech) or `area` (non-tech)

### GET `/user/dashboard` (auth)
Get dashboard snapshot with:
- `user`
- `todayStatus` (`done | not_done | pending`)
- `partner` (if matched)
- `matching.status`

## 5. Matching Endpoints
Mounted under both `/match` and `/matches`.

### POST `/match/find` (auth)
Find or resolve best match partner for current user.

Alias:
- `POST /matches/find`

## 6. Discovery Endpoints

### GET `/discovery/roles?q=<query>` (auth)
Search role aggregates and return counts:
- `role`
- `totalUsers`
- `activeUsers`
- `waitingUsers`

### GET `/discovery/role/:roleName` (auth)
Return sample users for exact role match (case-insensitive).

## 7. Connection Endpoints

### POST `/connection/display-name` (auth)
Generate unique display name from role/specialization.

### POST `/connection/request` (auth)
Send connection request.

Request body:
```json
{
  "toUserId": "<target-user-id>"
}
```

### POST `/connection/request/accept` (auth)
Accept request(s) from a user.

Request body:
```json
{
  "fromUserId": "<requester-user-id>"
}
```

### POST `/connection/request/reject` (auth)
Reject request(s) from a user.

Request body:
```json
{
  "fromUserId": "<requester-user-id>"
}
```

### GET `/connection/requests` (auth)
List pending incoming requests.

### GET `/connection/list` (auth)
List established user connections.

### GET `/connection/suggestions?limit=10` (auth)
Get ranked profile suggestions.

### GET `/connection/search?q=<query>&limit=20` (auth)
Search discoverable profiles.

### GET `/connection/profile/:userId` (auth)
Get public profile details.

## 8. Chat Endpoints
Chat router is mounted under both `/api` and `/api/chats`.

### GET `/` 
Readiness endpoint for chat feature.

### GET `/conversations` (auth)
List conversations for current user.

### POST `/conversations` (auth)
Create/reuse conversation.

Request body (optional):
```json
{
  "partnerId": "<user-id>"
}
```

### GET `/messages/:conversationId?page=1&limit=20` (auth)
Get paginated message list.

### POST `/messages` (auth)
Send a text/check-in message.

Example request body:
```json
{
  "conversationId": "<conversation-id>",
  "type": "text",
  "content": "Hello",
  "metadata": {
    "clientMessageId": "optional-id"
  }
}
```

### POST `/messages/:messageId/seen` (auth)
Mark message as seen by current user.

## 9. Realtime Socket Events
Connection auth supports token via socket auth payload, bearer header, or cookie.

Client -> server:
- `join_conversation`
- `send_message`
- `mark_seen`

Server -> client:
- `receive_message`
- `mark_seen`

## 10. Common Status Codes
- `200`: success
- `201`: created
- `400`: validation/input issue
- `401`: auth required/invalid token
- `403`: forbidden action
- `404`: resource not found
- `409`: conflict (duplicates/state conflicts)
- `500`: internal error

## 11. Notes for API Evolution
Phase 2 recommendation:
- Publish formal OpenAPI spec under `docs/openapi/rolebuddy.v1.yaml`
- Add explicit request/response JSON schemas
- Introduce endpoint versioning strategy (`/api/v1`)
