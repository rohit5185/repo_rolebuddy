# API Reference — RoleBuddy

> Extracted from actual route and controller files. Documents current implementation only.
> All protected routes require JWT via `Authorization: Bearer <token>` header OR `accessToken` HttpOnly cookie.

---

## Standard Response Format

**Success:**
```json
{ "message": "...", "data": { ... } }
```

**Error:**
```json
{ "message": "...", "data": null }
```

All endpoints follow this format with zero exceptions.

---

## Base URL

```
http://localhost:5000
```

---

## Health Check

### `GET /health`

No auth required.

**Response 200:**
```json
{
  "message": "Service is healthy.",
  "data": {
    "status": "ok",
    "service": "rolebuddy-backend",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Auth — `/api/auth`

### `POST /api/auth/signup`

Register a new user. No auth required.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:**
- `email`: valid email format, normalized to lowercase
- `password`: minimum 8 characters

**Response 201:**
```json
{
  "message": "Signup successful.",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "createdAt": "...",
      "domain": null,
      "domainArea": "Unassigned",
      "primaryArea": null,
      "area": null,
      "specialization": null,
      "role": null,
      "experience": null,
      "skills": [],
      "intent": null,
      "goal": null,
      "dailyGoal": null,
      "availabilityFrequency": null,
      "availabilityTime": null,
      "availability": null,
      "preferences": [],
      "status": "waiting",
      "matchedUserId": null,
      "onboardingCompleted": false
    }
  }
}
```

Also sets `accessToken` HttpOnly cookie.

**Errors:**
- `400` — invalid email or password < 8 chars
- `409` — email already registered

---

### `POST /api/auth/login`

Authenticate an existing user. No auth required.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "message": "Login successful.",
  "data": {
    "user": { ...same as signup user object... }
  }
}
```

Also sets `accessToken` HttpOnly cookie.

**Errors:**
- `400` — invalid email format or password < 8 chars
- `401` — invalid credentials

---

### `POST /api/auth/logout`

Clear the session. No auth required.

**Request Body:** (none)

**Response 200:**
```json
{
  "message": "Logged out successfully.",
  "data": null
}
```

Clears the `accessToken` HttpOnly cookie.

---

## User — `/api/user`

All routes require auth.

### `GET /api/user/profile`

Returns the authenticated user's profile.

**Response 200:**
```json
{
  "message": "Profile fetched successfully.",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "createdAt": "...",
      "domain": "tech",
      "domainArea": "Software Development",
      "primaryArea": "Software Development",
      "area": null,
      "specialization": "Frontend Engineer",
      "role": "Frontend Engineer",
      "experience": "junior",
      "skills": ["React", "TypeScript"],
      "intent": "Job search",
      "goal": "Get a frontend role",
      "dailyGoal": 2,
      "availabilityFrequency": "Weekdays",
      "availabilityTime": "morning",
      "availability": "morning",
      "preferences": [],
      "status": "waiting",
      "matchedUserId": null,
      "onboardingCompleted": true
    }
  }
}
```

**Errors:**
- `401` — not authenticated

---

### `GET /api/user/match-history`

Returns the user's match history — current active match partner and accepted connections.

**Response 200:**
```json
{
  "message": "Match history fetched.",
  "data": [
    {
      "userId": "...",
      "role": "Frontend Engineer",
      "experience": "junior",
      "status": "active"
    },
    {
      "userId": "...",
      "role": "Backend Engineer",
      "experience": "mid-level",
      "status": "connected"
    }
  ]
}
```

**Status values:**
- `active` — current `matchedUserId` partner
- `connected` — accepted connection

**Notes:**
- No email, no password, no PII exposed
- Max 1 active match + up to 20 connections

**Errors:**
- `401` — not authenticated
- `404` — user not found

---

### `PUT /api/user/onboarding`

Complete or update onboarding. Requires auth.

**Supports two modes:**

**Mode 1 — Legacy (simple):**
```json
{
  "role": "Frontend Engineer",
  "experience": "junior",
  "dailyGoal": 2,
  "availability": "morning"
}
```

**Mode 2 — Structured (full):**
```json
{
  "domain": "tech",
  "primaryArea": "Software Development",
  "specialization": "Frontend Engineer",
  "role": "Frontend Engineer",
  "experience": "junior",
  "skills": ["React", "TypeScript"],
  "intent": "Job search",
  "goal": "Get a frontend role",
  "dailyGoal": 2,
  "availabilityFrequency": "Weekdays",
  "availabilityTime": "morning",
  "preferences": []
}
```

**Non-tech domain (structured):**
```json
{
  "domain": "non-tech",
  "area": "Marketing",
  "specialization": "Digital Marketing",
  "role": "Marketing Manager",
  ...
}
```

**Field Validation:**
- `domain`: `"tech"` | `"non-tech"` (default: `"tech"` in legacy mode)
- `experience`: one of `["student / fresher", "fresher", "beginner", "junior", "mid-level", "senior", "manager", "lead / head", "experienced"]`
- `dailyGoal`: `1` | `2` | `3`
- `availabilityTime` / `availability`: `"morning"` | `"afternoon"` | `"night"`
- `role`: required, max 80 chars, safe chars only
- `skills`: array, max 20 items, each max 60 chars

**Response 200:**
```json
{
  "message": "Onboarding completed successfully.",
  "data": {
    "user": { ...full user profile... }
  }
}
```

**Errors:**
- `400` — validation failure on any field
- `404` — user not found

---

### `GET /api/user/dashboard`

Returns dashboard snapshot. Also updates `lastActiveAt`. Requires auth.

**Response 200:**
```json
{
  "message": "Dashboard fetched successfully.",
  "data": {
    "user": {
      "role": "Frontend Engineer",
      "experience": "junior",
      "dailyGoal": 2,
      "streakCount": 5,
      "lastCheckInDate": "2024-01-01T00:00:00.000Z",
      "lastActiveAt": "2024-01-01T00:00:00.000Z",
      "onboardingCompleted": true,
      "consistencyStreak": 12,
      "contributionCount": 8,
      "reliability": {
        "score": 96,
        "label": "Highly Reliable"
      },
      "preparationStatus": "Preparing Actively"
    },
    "todayStatus": "pending",
    "partner": {
      "partnerId": "...",
      "partnerRole": "Backend Engineer",
      "partnerExperience": "mid-level",
      "partnerStreak": 3,
      "partnerLastCheckIn": "2024-01-01T00:00:00.000Z",
      "partnerLastActive": "2024-01-01T00:00:00.000Z"
    },
    "matching": {
      "status": "matched"
    }
  }
}
```

**Notes:**
- `todayStatus`: `"pending"` | `"done"` | `"not_done"`
- `partner` is `null` when `matching.status === "waiting"`
- `matching.status`: `"waiting"` | `"matched"`
- `reliability.score` and `reliability.label` are `null` when `totalAcceptedCommitments < 3`
- `preparationStatus`: `"Starting Preparation"` | `"Preparing Actively"` | `"Interview Ready"`
- `consistencyStreak`: consecutive active calendar days (qualifying events: connection send/accept, chat message)

**Errors:**
- `401` — not authenticated
- `404` — user not found

---

## Match — `/api/match` or `/api/matches`

Both prefixes point to the same router. All routes require auth.

### `POST /api/match/find` (or `POST /api/matches/find`)

Find or retrieve a match. Requires `onboardingCompleted: true`.

**Request Body:** (none required)

**Response 200 — Match found:**
```json
{
  "message": "Match result fetched successfully.",
  "data": {
    "matched": true,
    "matchScore": 90,
    "conversationId": "<conversationId>",
    "partner": {
      "role": "Frontend Engineer",
      "specialization": "Frontend Engineer",
      "experience": "junior",
      "domainArea": "Software Development"
    }
  }
}
```

**Match Score Scale:**
| Score | Condition |
|-------|-----------|
| 100   | Same role + same experience |
| 90    | Same role |
| 80    | Same specialization + same experience |
| 70    | Same specialization |
| 60    | Same domainArea + same experience |
| 50    | Same domainArea |
| 40    | Fallback (any active user) |

**Errors:**
- `400` — onboarding not completed
- `404` — user not found
- `409` — no active candidates available

### `POST /api/match/rematch`

Break the current match if eligible and run matchmaking again.

**Request Body:** (none)

**Response 200:**
```json
{
  "message": "Rematch completed successfully.",
  "data": {
    "matched": true,
    "matchScore": 90,
    "conversationId": "<conversationId>",
    "partner": {
      "role": "Frontend Engineer",
      "specialization": "Frontend Engineer",
      "experience": "junior",
      "domainArea": "Software Development"
    }
  }
}
```

**Errors:**
- `400` — onboarding not completed
- `404` — user not found
- `409` — rematch cooldown has not elapsed or no active candidates available

---

### `POST /api/match/promote`

Send a promotion request to convert a connection into a match. Requires auth.

**Request Body:**
```json
{
  "targetUserId": "<userId>"
}
```

**Response 201:**
```json
{
  "message": "Promotion request sent successfully.",
  "data": {
    "request": {
      "from": "<fromUserId>",
      "to": "<targetUserId>",
      "status": "pending"
    }
  }
}
```

**Rules:**
- Both users must be connected (in `connections[]`)
- Sender must not be in 24h match cooldown
- Duplicate pending requests are prevented
- Both users must have completed onboarding

**Errors:**
- `400` — self-promotion, not connected, onboarding not completed
- `404` — user or target not found
- `409` — cooldown active, duplicate request

---

### `POST /api/match/promote/accept`

Accept a pending promotion request, creating a new match. Requires auth.

**Request Body:**
```json
{
  "fromUserId": "<userId>"
}
```

**Response 200:**
```json
{
  "message": "Promotion accepted. Match created successfully.",
  "data": {
    "matched": true,
    "matchScore": 90,
    "conversationId": "<conversationId>",
    "partner": {
      "role": "Frontend Engineer",
      "specialization": "Frontend Engineer",
      "experience": "junior",
      "domainArea": "Software Development"
    }
  }
}
```

**Behavior:**
- Validates the pending request exists
- Enforces 24h cooldown for both users
- Breaks existing matches for both users (if any)
- Creates a new 1:1 match in a MongoDB transaction
- Removes the pending request atomically
- Creates or retrieves a conversation

**Errors:**
- `400` — invalid request
- `404` — user, requester, or request not found
- `409` — cooldown active, transaction conflict

---

## Discovery — `/api/discovery`

All routes require auth.

### `GET /api/discovery/roles`

Search roles with aggregate counts. No query = returns top 25 roles.

**Query Parameters:**
| Param | Type   | Required | Notes                                |
|-------|--------|----------|--------------------------------------|
| `q`   | String | No       | max 50 chars, safe chars only        |

**Response 200:**
```json
{
  "message": "Roles fetched successfully.",
  "data": [
    {
      "role": "Frontend Engineer",
      "totalUsers": 42,
      "activeUsers": 18,
      "waitingUsers": 10
    }
  ]
}
```

**Notes:**
- `activeUsers`: active within last 24 hours
- `waitingUsers`: users with `status: "waiting"`
- Sorted by `totalUsers DESC, role ASC`
- Max 25 results

**Errors:**
- `400` — query too long or invalid characters

---

### `GET /api/discovery/role/:roleName`

Get sample users for a specific role.

**Path Parameters:**
| Param      | Type   | Required | Notes                               |
|------------|--------|----------|-------------------------------------|
| `roleName` | String | Yes      | max 80 chars, safe chars only       |

**Response 200:**
```json
{
  "message": "Role detail fetched successfully.",
  "data": {
    "role": "Frontend Engineer",
    "users": [
      {
        "experience": "junior",
        "dailyGoal": 2,
        "status": "waiting",
        "matchScore": 90,
        "reliabilityLabel": "Highly Reliable",
        "contributionCount": 8,
        "activeRecently": true
      }
    ]
  }
}
```

**Notes:**
- Returns max 10 sample users
- Uses active-user browsing logic and the same score calculation as matching
- Sorted by `matchScore DESC`, then `lastActiveAt DESC`
- Only `experience`, `dailyGoal`, `status`, `matchScore`, `reliabilityLabel`, `contributionCount`, `activeRecently` returned per user (no PII)
- `reliabilityLabel` is `null` when user has fewer than 3 total commitments
- `activeRecently` is `true` when user was active within the last 24 hours

**Errors:**
- `400` — roleName missing, too long, or invalid characters

---

## Connection — `/api/connection`

All routes require auth.

### `POST /api/connection/display-name`

Generate and assign a unique anonymous display name for the current user. Idempotent — returns existing name if already set.

**Request Body:** (none)

**Response 200:**
```json
{
  "message": "Display name generated successfully.",
  "data": {
    "displayName": "Frontend42"
  }
}
```

**Note:** Format: `<specialization|role|"User"><NN>` (NN = random 2-digit number)

**Errors:**
- `404` — user not found
- `500` — could not generate unique name after 5 attempts

---

### `POST /api/connection/request`

Send a connection request to another user.

**Request Body:**
```json
{
  "toUserId": "<userId>"
}
```

**Response 201 (new) / 200 (idempotent):**
```json
{
  "message": "Connection request sent successfully",
  "data": {
    "request": {
      "from": "<fromUserId>",
      "to": "<toUserId>",
      "status": "pending"
    }
  }
}
```

**Status Code:** `201` when a new request is created, `200` when a duplicate pending request already exists (idempotent).

**Errors:**
- `400` — invalid userId, cannot request self, already connected
- `409` — inverse pending request already exists (target already requested you)
- `404` — user not found

---

### `POST /api/connection/request/accept`

Accept a pending connection request.

**Request Body:**
```json
{
  "fromUserId": "<userId>"
}
```

**Response 200:**
```json
{
  "message": "Connection request accepted",
  "data": {
    "conversationId": "<conversationId>",
    "connection": {
      "userId": "<fromUserId>",
      "displayName": "SWE42",
      "role": "Backend Engineer"
    }
  }
}
```

**Errors:**
- `404` — user or requester not found, request not found

---

### `POST /api/connection/request/reject`

Reject a pending connection request.

**Request Body:**
```json
{
  "fromUserId": "<userId>"
}
```

**Response 200:**
```json
{
  "message": "Connection request rejected",
  "data": null
}
```

**Errors:**
- `404` — user not found, request not found

---

### `GET /api/connection/requests`

Get all pending connection requests for the current user.

**Response 200:**
```json
{
  "message": "Pending requests fetched successfully",
  "data": [
    {
      "from": {
        "userId": "...",
        "_id": "...",
        "displayName": "SWE42",
        "role": "Backend Engineer",
        "specialization": "Backend Engineer",
        "experience": "mid-level",
        "domainArea": "Software Development"
      },
      "to": "<toUserId>",
      "status": "pending",
      "createdAt": "..."
    }
  ]
}
```

**Errors:**
- `404` — user not found

---

### `GET /api/connection/list`

Get all accepted connections for the current user.

**Response 200:**
```json
{
  "message": "Connections fetched successfully",
  "data": [
    {
      "userId": {
        "_id": "...",
        "displayName": "SWE42",
        "role": "Backend Engineer",
        "specialization": "Backend Engineer",
        "experience": "mid-level",
        "domainArea": "Software Development",
        "lastActiveAt": "..."
      }
    }
  ]
}
```

**Errors:**
- `404` — user not found

---

### `GET /api/connection/suggestions`

Get profile suggestions ranked by match score.

**Query Parameters:**
| Param   | Type   | Required | Default | Notes         |
|---------|--------|----------|---------|---------------|
| `limit` | Number | No       | 10      | max results   |

**Response 200:**
```json
{
  "message": "Profile suggestions fetched successfully",
  "data": [
    {
      "_id": "...",
      "displayName": "SWE42",
      "role": "Frontend Engineer",
      "specialization": "Frontend Engineer",
      "domainArea": "Software Development",
      "experience": "junior",
      "dailyGoal": 2,
      "status": "waiting",
      "availability": "morning",
      "lastActiveAt": "...",
      "matchScore": 90,
      "relation": "available"
    }
  ]
}
```

**Notes:**
- Unified visibility engine excludes `matched`, `connected`, `pending_sent`, and `pending_received` candidates
- Candidate pool uses canonical matcher filters (`onboardingCompleted`, active in 24h, `status=waiting`, `matchedUserId=null`)

**Errors:**
- `400` — onboarding not completed
- `404` — user not found

---

### `GET /api/connection/search`

Search profiles by role, specialization, domainArea, or displayName.

**Query Parameters:**
| Param   | Type   | Required | Default | Notes                     |
|---------|--------|----------|---------|---------------------------|
| `q`     | String | Yes      | —       | search query (required)   |
| `limit` | Number | No       | 20      | max results               |

**Response 200:**
```json
{
  "message": "Search results fetched successfully",
  "data": [
    {
      "_id": "...",
      "displayName": "SWE42",
      "role": "Frontend Engineer",
      "specialization": "Frontend Engineer",
      "domainArea": "Software Development",
      "experience": "junior",
      "dailyGoal": 2,
      "status": "waiting",
      "availability": "morning",
      "lastActiveAt": "...",
      "matchScore": 90,
      "relation": "available"
    }
  ]
}
```

**Errors:**
- `400` — empty search query
- `404` — user not found

---

### `GET /api/connection/profile/:userId`

Get public profile of any user by ID.

**Path Parameters:**
| Param    | Type   | Required |
|----------|--------|----------|
| `userId` | String | Yes      |

**Response 200:**
```json
{
  "message": "Profile fetched successfully",
  "data": {
    "_id": "...",
    "displayName": "SWE42",
    "role": "Frontend Engineer",
    "specialization": "Frontend Engineer",
    "domainArea": "Software Development",
    "experience": "junior",
    "dailyGoal": 2,
    "availability": "morning",
    "lastActiveAt": "...",
    "activeToday": true,
    "contributionCount": 8,
    "reliabilityLabel": "Highly Reliable"
  }
}
```

**Notes:**
- `activeToday` is `true` if user was active since UTC midnight today
- `reliabilityLabel` is `null` when user has fewer than 3 total commitments

**Errors:**
- `404` — user not found

---

## Chat — `/api` (or `/api/chats`)

Both prefixes route to the same chat router. All routes (except base) require auth.

### `GET /api/`

Health check for chat feature. No auth required.

**Response 200:**
```json
{ "message": "Chat feature is ready.", "data": null }
```

---

### `GET /api/conversations`

List all active conversations for the current user, sorted by most recently updated.

**Response 200:**
```json
{
  "message": "Conversations fetched successfully.",
  "data": {
    "conversations": [
      {
        "id": "...",
        "participants": [
          { "id": "...", "email": "...", "role": "...", "experience": "..." }
        ],
        "partner": { "id": "...", "email": "...", "role": "...", "experience": "..." },
        "lastMessage": {
          "id": "...",
          "conversationId": "...",
          "senderId": "...",
          "sender": { "id": "...", "email": "...", "role": "...", "experience": "..." },
          "type": "text",
          "content": "Hello!",
          "metadata": {},
          "seenBy": ["..."],
          "createdAt": "...",
          "updatedAt": "..."
        },
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### `POST /api/conversations`

Create or retrieve a conversation with a matched or connected partner.
Idempotent — returns existing conversation if already exists.
Also triggers a daily check-in message if not already sent today.

**Request Body:**
```json
{
  "partnerId": "<userId>"
}
```

**Response 201 (new):**
```json
{
  "message": "Conversation created successfully.",
  "data": {
    "conversation": { ...conversation object... }
  }
}
```

**Response 200 (existing):**
```json
{
  "message": "Conversation already exists.",
  "data": {
    "conversation": { ...conversation object... }
  }
}
```

**Errors:**
- `400` — no matched partner found, invalid partnerId
- `403` — can only chat with matched or connected users
- `404` — user or partner not found

---

### `GET /api/messages/:conversationId`

Get paginated messages for a conversation.

**Path Parameters:**
| Param            | Type   | Required |
|------------------|--------|----------|
| `conversationId` | String | Yes      |

**Query Parameters:**
| Param   | Type   | Required | Default | Max |
|---------|--------|----------|---------|-----|
| `page`  | Number | No       | 1       | —   |
| `limit` | Number | No       | 20      | 50  |

**Response 200:**
```json
{
  "message": "Messages fetched successfully.",
  "data": {
    "messages": [
      {
        "id": "...",
        "conversationId": "...",
        "senderId": "...",
        "sender": { "id": "...", "email": "...", "role": "...", "experience": "..." },
        "type": "text",
        "content": "Hello!",
        "metadata": {},
        "seenBy": ["..."],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "hasNextPage": true
    }
  }
}
```

**Notes:**
- Messages returned in ascending order (oldest first)
- Also triggers `ensureDailyCheckin` on fetch

**Errors:**
- `400` — invalid conversationId
- `403` — no access to this conversation
- `404` — conversation not found

---

### `POST /api/messages`

Send a message to a conversation.

**Request Body (text message):**
```json
{
  "conversationId": "...",
  "type": "text",
  "content": "Hello!",
  "metadata": {}
}
```

**Request Body (check-in response):**
```json
{
  "conversationId": "...",
  "type": "checkin",
  "content": "",
  "metadata": {
    "sourceCheckinId": "...",
    "dateKey": "2024-01-01",
    "status": "done",
    "clientMessageId": "optional-dedup-id"
  }
}
```

**Response 201:**
```json
{
  "message": "Message sent successfully.",
  "data": {
    "message": { ...message object... },
    "conversation": { ...conversation object... }
  }
}
```

**Additional fields when type=checkin and status=not_done:**
```json
{
  "data": {
    "message": { ...checkin response message... },
    "alert": { ...alert message object or null... },
    "conversation": { ...conversation object... }
  }
}
```

**Message Types:**
- `"text"` — regular chat message
- `"checkin"` — check-in response (user-sent); `"daily_checkin"` kind is system-generated only
- `"system"` — system message
- `"reminder"` — reminder message
- `"alert"` — accountability alert (auto-generated when partner misses goal)

**Errors:**
- `400` — invalid conversationId, empty content, invalid check-in status, system checkins not allowed
- `403` — no access to conversation
- `404` — conversation not found

---

### `POST /api/messages/:messageId/seen`

Mark a message as seen by the current user.

**Path Parameters:**
| Param       | Type   | Required |
|-------------|--------|----------|
| `messageId` | String | Yes      |

**Request Body:** (messageId can also be provided in body)
```json
{
  "messageId": "..."
}
```

**Response 200:**
```json
{
  "message": "Message seen successfully.",
  "data": {
    "message": { ...message object with updated seenBy... }
  }
}
```

Also emits `mark_seen` event to the conversation room via Socket.IO.

**Errors:**
- `400` — invalid messageId
- `403` — no access to conversation
- `404` — message not found

---

## Socket.IO Events

### Connection

```
URL: ws://localhost:5000
Auth: handshake.auth.token = "<jwt>"
   OR Authorization header = "Bearer <jwt>"
   OR cookie accessToken = "<jwt>"
```

On connect, the socket automatically joins `user:<userId>` room.

---

### Client → Server Events

#### `join_conversation`

```js
socket.emit("join_conversation", { partnerId: "<userId>" }, (ack) => {
  // ack: { ok: true, conversation: {...} }
  // ack: { ok: false, message: "..." }
});
```

#### `send_message`

```js
socket.emit("send_message", {
  conversationId: "...",
  type: "text",
  content: "Hello!",
  metadata: {}
}, (ack) => {
  // ack: { ok: true, message: {...}, conversation: {...} }
  // ack: { ok: false, message: "..." }
});
```

#### `mark_seen`

```js
socket.emit("mark_seen", { messageId: "..." }, (ack) => {
  // ack: { ok: true, message: {...} }
  // ack: { ok: false, message: "..." }
});
```

---

### Server → Client Events

#### `receive_message`

Emitted to `conversation:<conversationId>` room when a new message is sent.

```json
{ ...message object... }
```

#### `mark_seen`

Emitted to `conversation:<conversationId>` room when a message is marked seen.

```json
{
  "conversationId": "...",
  "message": { ...message object... },
  "seenBy": ["userId1", "userId2"]
}
```

---

## Error Response Format

All errors follow:
```json
{ "message": "Human-readable error description.", "data": null }
```

In development (`NODE_ENV=development`), errors also include:
```json
{ "message": "...", "data": null, "stack": "Error stack trace..." }
```

### Common HTTP Error Codes

| Code | Meaning                                              |
|------|------------------------------------------------------|
| 400  | Bad Request — validation failure                     |
| 401  | Unauthorized — missing or invalid token              |
| 403  | Forbidden — authenticated but not allowed            |
| 404  | Not Found — resource does not exist                  |
| 409  | Conflict — duplicate resource or business rule clash |
| 500  | Internal Server Error                                |

---

## Exchange — `/api/exchanges`

All routes require auth. Exchange visibility is limited to participants only.

---

### `GET /api/exchanges`

List all exchanges for the authenticated user, sorted by most recently updated.

**Response 200:**
```json
{
  "message": "Exchanges fetched successfully.",
  "data": {
    "exchanges": [
      {
        "id": "...",
        "participants": ["<userId1>", "<userId2>"],
        "exchangeType": "role_experience",
        "status": "active",
        "permissionLayer": "professional",
        "unlockState": {
          "professionalUnlocked": true,
          "sensitiveUnlocked": false
        },
        "relevance": { "score": 90, "category": "high" },
        "capability": { "score": 75, "category": "moderate", "warnings": [] },
        "reciprocity": { "score": 80, "category": "balanced" },
        "contextualWarnings": [],
        "trustSnapshot": {
          "initiatorTier": "consistent",
          "targetTier": "unverified",
          "initiatorReputation": "neutral",
          "targetReputation": "neutral"
        },
        "approvals": {
          "professional": { "self": true, "partner": true },
          "sensitive": { "self": false, "partner": false }
        },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

**Notes:**
- Max 50 exchanges returned
- `approvals` is caller-perspective: `self` = current user's approval, `partner` = other participant's approval

**Errors:**
- `401` — not authenticated

---

### `POST /api/exchanges`

Create a new exchange request. The initiator's template must already be saved before requesting.

**Request Body:**
```json
{
  "targetUserId": "<userId>",
  "exchangeType": "role_experience"
}
```

**`exchangeType` values:**
- `"role_experience"` — requires initiator to have a saved `roleTemplate`
- `"interview_experience"` — requires initiator to have a saved `interviewTemplate`

**Rules:**
- Target must be a matched or connected user
- Both users must have completed onboarding
- Cannot exchange with self
- If a `requested` or `active` exchange of the same type already exists between the pair, the existing exchange is returned (idempotent)
- On creation: a system message with `kind: "exchange_requested_notification"` is posted to the shared conversation

**Response 201 (new):**
```json
{
  "message": "Exchange request created successfully.",
  "data": {
    "exchange": { ...exchange object... },
    "warnings": ["..."],
    "created": true
  }
}
```

**Response 200 (existing):**
```json
{
  "message": "Exchange request already exists.",
  "data": {
    "exchange": { ...exchange object... },
    "warnings": ["..."],
    "created": false
  }
}
```

**Errors:**
- `400` — invalid exchange type, self-exchange, onboarding not completed, template not saved
- `403` — target is not a matched or connected user
- `404` — user or target not found

---

### `POST /api/exchanges/:exchangeId/accept`

Accept an exchange request. Both participants must accept (approve professional unlock) before the exchange becomes `active` and templates are shared.

**Path Parameters:**
| Param        | Type   | Required |
|--------------|--------|----------|
| `exchangeId` | String | Yes      |

**Request Body:** (none)

**Rules:**
- The accepting user must have the required template saved (`roleTemplate` for `role_experience`, `interviewTemplate` for `interview_experience`)
- Idempotent: if exchange is already `active`, or if the caller already approved, returns current exchange state
- When both participants have approved:
  - `status` → `"active"`, `permissionLayer` → `"professional"`, `professionalUnlocked` → `true`
  - System message with `kind: "exchange_accepted_notification"` posted to conversation
  - Both participants' templates are immediately posted as system messages with `kind: "exchange_template"` and `templateKind: "role" | "interview"`
- Until second approval: `status` remains `"requested"`, `permissionLayer` remains `"compatibility"`

**Response 200:**
```json
{
  "message": "Exchange request accepted.",
  "data": {
    "exchange": { ...exchange object... }
  }
}
```

**Errors:**
- `400` — template not saved
- `403` — not a participant
- `404` — exchange not found
- `409` — exchange is no longer in `requested` status

---

### `POST /api/exchanges/:exchangeId/unlock-sensitive`

Approve sensitive layer unlock for the current user. Sensitive layer unlocks only after **both** participants approve.

**Path Parameters:**
| Param        | Type   | Required |
|--------------|--------|----------|
| `exchangeId` | String | Yes      |

**Request Body:** (none)

**Rules:**
- Professional layer must already be unlocked
- Relevance score must be ≥ 50 (hard gate — 403 if below)
- Does **not** hard-block on verification status or capability score; friction warnings are returned for UI display
- Idempotent: already-approved returns current exchange with `warning: "Waiting for your partner to approve sensitive unlock."`; already fully unlocked returns with `warning: "Sensitive layer is already unlocked."`
- On first-user approval: system message with `kind: "sensitive_unlock_requested"` posted to conversation
- On dual approval: system message with `kind: "sensitive_unlock_approved"` posted to conversation

**Response 200:**
```json
{
  "message": "Sensitive unlock preference recorded.",
  "data": {
    "exchange": { ...exchange object... },
    "warning": "Sensitive sharing preference recorded. Dual approval is required before sensitive entries unlock.",
    "frictionWarnings": [
      "Sensitive layer: verification is still building for one or both users. Only share what you are comfortable with."
    ]
  }
}
```

**Errors:**
- `400` — professional layer not yet unlocked
- `403` — relevance score < 50 (profiles not compatible enough)
- `404` — exchange not found

---

### `POST /api/exchanges/:exchangeId/share-sensitive`

Share ephemeral sensitive information. Uses a **two-phase mutual reveal**: both users must submit before either's data is revealed in chat. Data is **not** persisted to user profile.

**Path Parameters:**
| Param        | Type   | Required |
|--------------|--------|----------|
| `exchangeId` | String | Yes      |

**Request Body:**
```json
{
  "template": {
    "hrContact": "string | null",
    "recruiterDetails": "string | null",
    "referralPathway": "string | null",
    "internalProcessNotes": "string | null",
    "additionalNotes": "string | null"
  }
}
```

**At least one field must be non-null.**

**Two-phase flow:**

| State | Behavior |
|-------|----------|
| First user submits, partner has not yet | Template stored in `pendingSensitiveTemplates`; system message `kind: "sensitive_info_submitted_waiting"` posted; returns `{ shared: false, waiting: true }` |
| Second user submits | Both templates simultaneously posted to chat as `kind: "exchange_sensitive_template"` (one per user); confirmation message `kind: "sensitive_exchange_complete"` posted; `pendingSensitiveTemplates` cleared; `lastSensitiveSharedAt` updated; returns `{ shared: true, waiting: false }` |
| Actor already submitted (idempotent) | Returns current waiting state without re-submitting |

**24-hour cooldown:** After a mutual reveal, `lastSensitiveSharedAt` is set. Further sharing is blocked until 24h have elapsed. Returns `429` with hours remaining.

**Response 200 — waiting for partner:**
```json
{
  "message": "Sensitive information shared in chat.",
  "data": {
    "shared": false,
    "waiting": true,
    "message": "Your sensitive info has been saved. As soon as your partner submits theirs, both will be revealed in chat simultaneously."
  }
}
```

**Response 200 — mutual reveal complete:**
```json
{
  "message": "Sensitive information shared in chat.",
  "data": {
    "shared": true,
    "waiting": false,
    "message": "Both sensitive templates revealed in chat simultaneously."
  }
}
```

**Errors:**
- `400` — no template provided, all fields null
- `403` — sensitive layer not yet unlocked
- `404` — exchange or partner not found
- `429` — 24-hour cooldown active (message includes remaining hours)

---

### `POST /api/exchanges/:exchangeId/complete`

Mark an exchange as completed. Updates `successfulExchangeCount` and `exchangeStats.completedExchanges` for both participants. Recalculates trust tier and reputation for both.

**Path Parameters:**
| Param        | Type   | Required |
|--------------|--------|----------|
| `exchangeId` | String | Yes      |

**Request Body:** (none)

**Rules:**
- Only allowed when `status === "active"`
- Idempotent: if already `completed`, returns current exchange
- Atomic update prevents race-condition double-increments

> **Note:** This endpoint is preserved for lifecycle completeness but is not currently exposed in the frontend UI.

**Response 200:**
```json
{
  "message": "Exchange marked as completed.",
  "data": {
    "exchange": { ...exchange object... }
  }
}
```

**Errors:**
- `403` — not a participant
- `404` — exchange not found
- `409` — exchange is not in `active` status

---

### `GET /api/exchanges/:exchangeId/entries`

List paginated exchange entries visible to the current participant.

**Path Parameters:**
| Param        | Type   | Required |
|--------------|--------|----------|
| `exchangeId` | String | Yes      |

**Query Parameters:**
| Param   | Type   | Required | Default | Max |
|---------|--------|----------|---------|-----|
| `page`  | Number | No       | 1       | —   |
| `limit` | Number | No       | 20      | 50  |

**Visibility rules:**
- If `sensitiveUnlocked: false` → only `visibilityLayer: "professional"` entries returned
- If `sensitiveUnlocked: true` → all entries returned

**Response 200:**
```json
{
  "message": "Exchange entries fetched successfully.",
  "data": {
    "entries": [
      {
        "id": "...",
        "exchangeId": "...",
        "authorId": "...",
        "entryType": "role",
        "visibilityLayer": "professional",
        "content": "...",
        "metadata": {},
        "createdAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "hasNextPage": false
    }
  }
}
```

**Errors:**
- `403` — not a participant
- `404` — exchange not found

---

### `POST /api/exchanges/entries`

Share a new exchange entry (free-text contribution).

**Request Body:**
```json
{
  "exchangeId": "<exchangeId>",
  "entryType": "role",
  "content": "...",
  "metadata": {}
}
```

**`entryType` values:** `"role"` | `"interview"` | `"sensitive"`

**Rules:**
- Exchange must be `active`
- `entryType` must match the exchange's type (`"role"` for `role_experience`, `"interview"` for `interview_experience`); `"sensitive"` is always allowed
- `"role"` and `"interview"` entries require `professionalUnlocked: true`
- `"sensitive"` entries require `sensitiveUnlocked: true`
- `content` must be non-empty

**Response 201:**
```json
{
  "message": "Exchange entry shared successfully.",
  "data": {
    "entry": {
      "id": "...",
      "exchangeId": "...",
      "authorId": "...",
      "entryType": "role",
      "visibilityLayer": "professional",
      "content": "...",
      "metadata": {},
      "createdAt": "..."
    }
  }
}
```

**Errors:**
- `400` — invalid entry type, type mismatch, empty content
- `403` — exchange not unlocked to required layer, not a participant
- `404` — exchange not found
- `409` — exchange is not `active`

---

### `POST /api/exchanges/report`

Report abuse in an exchange. Applies trust penalties to the reported participant and writes an auditable lifecycle log entry.

**Request Body:**
```json
{
  "exchangeId": "<exchangeId>",
  "reason": "..."
}
```

**Effects:**
- Exchange `status` → `"reported"`
- Reported user: `reportCount++`, `abuseIncidentCount++`, `exchangeStats.reportedByPeers++`
- Trust tier and reputation recalculated for reported user
- `exchange_trust_updated` Socket.IO event emitted to reported user

**Response 200:**
```json
{
  "message": "Exchange report submitted.",
  "data": { "reported": true }
}
```

**Errors:**
- `400` — missing reason
- `403` — not a participant
- `404` — exchange not found

---

### `GET /api/exchanges/profile`

Fetch the authenticated user's exchange profile and verification state.

**Response 200:**
```json
{
  "message": "Exchange profile fetched successfully.",
  "data": {
    "profile": {
      "lastJobExperience": "...",
      "lastInterviewExperience": "...",
      "roleTransitionNotes": "...",
      "roleTemplate": { ...role template fields... },
      "interviewTemplate": { ...interview template fields... },
      "verificationStatus": "pending",
      "verificationSource": "community_consistency",
      "submittedAt": "...",
      "reviewedAt": null
    }
  }
}
```

**`verificationStatus` values:** `"not_submitted"` | `"pending"` | `"verified"` | `"unverified"`

**Errors:**
- `404` — user not found

---

### `PUT /api/exchanges/profile`

Submit or update the exchange profile. At least one of: a valid `roleTemplate` (with `roleTitle` + at least one substantive field), a valid `interviewTemplate` (with `roleInterviewedFor`/`roleTitle` + at least one substantive field), or both `lastJobExperience` and `lastInterviewExperience` must be present.

**Request Body:**
```json
{
  "lastJobExperience": "string (optional)",
  "lastInterviewExperience": "string (optional)",
  "roleTransitionNotes": "string (optional)",
  "roleTemplate": {
    "roleTitle": "...",
    "industryCompanyType": "...",
    "companyType": "...",
    "experienceLevel": "...",
    "mainResponsibilities": "...",
    "typicalWorkflow": "...",
    "toolsMethodsUsed": "...",
    "skillsRequired": "...",
    "mostImportantSkills": "...",
    "whatMattersToSucceed": "...",
    "whatHelpedMost": "...",
    "biggestMistakesToAvoid": "...",
    "difficultyEnteringRole": "...",
    "adviceForSomeoneStartingToday": "...",
    "companyContext": "...",
    "responsibilities": [],
    "workflow": "...",
    "requiredSkills": [],
    "preparationStrategy": "..."
  },
  "interviewTemplate": {
    "roleInterviewedFor": "...",
    "industryCompanyType": "...",
    "companyType": "...",
    "experienceLevelTargeted": "...",
    "experienceLevel": "...",
    "interviewDateOptional": "...",
    "numberOfRounds": "...",
    "roundTypes": "...",
    "overallDifficulty": "...",
    "totalProcessDuration": "...",
    "mainTopicsEvaluated": "...",
    "notableQuestionsOrTasks": "...",
    "ifRejectedLikelyReasonOptional": "...",
    "whatYouWouldDoDifferently": "...",
    "finalAdviceForOthers": "...",
    "whatHelpedMost": "...",
    "roleTitle": "...",
    "companyContext": "...",
    "rounds": "...",
    "questionsTopics": [],
    "difficulty": "...",
    "outcome": "...",
    "preparationAdvice": "...",
    "rejectionReasons": "..."
  }
}
```

**Behavior:**
- Merges with existing profile (only supplied fields are overwritten)
- Sets `verificationStatus: "pending"`, `verificationSource: "community_consistency"`, and `submittedAt: now`
- No proof/image document verification — uses reputation signals only

**Response 200:**
```json
{
  "message": "Exchange profile submitted for verification.",
  "data": {
    "profile": { ...same shape as GET /api/exchanges/profile data.profile... }
  }
}
```

**Errors:**
- `400` — no valid template and insufficient legacy fields provided
- `404` — user not found

---

## Exchange Socket.IO Events

### Server → Client Events (Exchange-specific)

#### `exchange_updated`

Emitted to `user:<userId>` room for each participant when exchange state changes.

```json
{
  "exchangeId": "...",
  "action": "exchange_requested | exchange_accepted | sensitive_unlock_updated | exchange_entry_shared | sensitive_info_submitted | sensitive_info_shared"
}
```

Additional fields by action:
- `exchange_accepted`: includes `"permissionLayer": "professional" | "compatibility"`
- `sensitive_unlock_updated`: includes `"permissionLayer": "professional" | "sensitive"`

#### `exchange_trust_updated`

Emitted to `user:<userId>` room of the reported participant when a report penalty is applied.

```json
{
  "reason": "report_penalty_applied"
}

---

## Interviews — `/api/interviews`

All routes require auth.

### `GET /api/interviews/templates`

Phase 1-compatible system template listing (default source is system templates).

Query: `domain`, `type`, `source` (`system` | `public`)

### `GET /api/interviews/templates/mine`

Returns current user-owned active templates.

### `GET /api/interviews/templates/public`

Returns public active templates with filters.

Query: `domain`, `type`, `difficulty`, `role`

### `POST /api/interviews/templates`

Create a user-owned interview template.

### `PUT /api/interviews/templates/:templateId`

Update a user-owned interview template. System templates are immutable.

### `DELETE /api/interviews/templates/:templateId`

Soft-delete a user-owned interview template (`isActive: false`).

### `POST /api/interviews/templates/:templateId/duplicate`

Duplicate an accessible template as a new private user-owned template.

### `POST /api/interviews/request`

Create interview request in a conversation timeline.

Body:
```json
{
  "conversationId": "<id>",
  "templateId": "<id>",
  "interviewerRole": "interviewer",
  "mode": "text_async",
  "proposedSlots": ["2026-05-27T13:00:00.000Z", "2026-05-27T15:00:00.000Z"],
  "timezoneHint": "Asia/Calcutta"
}
```

`mode` values: `"text_async"` | `"live_online"` | `"live_video"` (`"live_video"` currently returns a coming-soon validation error)
For `live_online`, `proposedSlots` (2–3 unique UTC timestamps) is required.

### `GET /api/interviews/session/:conversationId`

Get current `pending`/`active`/`paused` interview session for a conversation.

### `POST /api/interviews/:sessionId/accept`
### `POST /api/interviews/:sessionId/decline`
### `POST /api/interviews/:sessionId/question`
### `POST /api/interviews/:sessionId/answer`
### `POST /api/interviews/:sessionId/feedback`
### `POST /api/interviews/:sessionId/complete`
### `POST /api/interviews/:sessionId/pause`

Phase 1 interview lifecycle endpoints preserved. Sessions continue to run entirely inside conversations.

For `live_online` mode:
- both users must be socket-connected for `accept`, `question`, `answer`, and `feedback`
- if either user disconnects during an active session, the session is auto-paused and an interview system message is posted

### `POST /api/interviews/:sessionId/pause`

Pause an active interview session. Participant-only endpoint. Idempotent when already paused.

**Response 200:**
```json
{
  "message": "Interview paused.",
  "data": {
    "session": {
      "id": "...",
      "status": "paused",
      "currentQuestionIndex": 2
    }
  }
}
```

**Errors:**
- `403` — requester is not a session participant
- `404` — session not found
- `409` — session is not in `active` state

### `POST /api/interviews/:sessionId/schedule/propose`

Re-propose 2–3 new slots for a `live_online` session.

### `POST /api/interviews/:sessionId/schedule/confirm`

Confirm one slot from the proposed slot list. On confirmation, Google Calendar event creation is attempted for both participants.

### `POST /api/interviews/:sessionId/schedule/decline`

Decline live-online scheduling and cancel the interview request/session.

### `GET /api/interviews/calendar/connect`

Returns Google OAuth URL for calendar connection.

### `GET /api/interviews/calendar/callback`

OAuth callback endpoint that stores calendar tokens.

### `GET /api/interviews/calendar/status`

Returns whether Google Calendar is configured and connected for the current user.

**Response 200:**
```json
{
  "message": "Google Calendar status fetched.",
  "data": {
    "configured": true,
    "connected": false
  }
}
```

### `POST /api/interviews/calendar/disconnect`

Disconnects Google Calendar for the current user.

### Interview Mode Input Lock

When interview mode is active in chat (`status: "active"`), normal text input is locked for both participants and the interview controls (question/answer/feedback lifecycle) are used instead.
