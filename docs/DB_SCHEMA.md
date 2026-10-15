# Database Schema - RoleBuddy (MongoDB)

Last updated: 2026-04-23
Primary ODM: Mongoose

## 1. Collections Overview
- `users`
- `conversations`
- `messages`

## 2. Users Collection
Model source: `backend/src/features/auth/auth.model.js`

### 2.1 Core Identity Fields
- `email` (String, required, unique, lowercase)
- `password` (String, required, min length 8)
- `createdAt` (timestamp)

### 2.2 Onboarding/Profile Fields
- `domain` (`tech | non-tech`, required when onboarding complete)
- `domainArea` (String, required, default `Unassigned`)
- `primaryArea` (String, nullable)
- `area` (String, nullable)
- `specialization` (String, nullable)
- `role` (String, nullable)
- `experience` (String, nullable)
- `skills` (String[])
- `intent` (String, nullable)
- `goal` (String, nullable)
- `dailyGoal` (Number, nullable)
- `availabilityFrequency` (String, nullable)
- `availabilityTime` (`morning | afternoon | night`, nullable)
- `availability` (String, nullable)
- `preferences` (String[])
- `onboardingCompleted` (Boolean, default `false`)

### 2.3 Activity and Accountability Fields
- `lastActiveAt` (Date, nullable)
- `lastCheckInDate` (Date, nullable)
- `streakCount` (Number, default `0`)
- `checkInHistory` (Array of `{ date, status }`)
  - `status`: `done | not_done`

### 2.4 Matching Fields
- `status` (`waiting | matched`, default `waiting`)
- `matchedUserId` (ObjectId ref `User`, nullable)

### 2.5 Connection/Social Fields
- `displayName` (String, unique, sparse)
- `connections` (Array of `{ userId: ObjectId ref User }`)
- `connectionRequests` (Array of request objects):
  - `from` (ObjectId ref User)
  - `to` (ObjectId ref User)
  - `status` (`pending | accepted | rejected`)
  - `createdAt` (Date)

### 2.6 Indexes
- `{ role: 1 }`
- `{ domainArea: 1 }`
- `{ status: 1 }`
- `{ lastActiveAt: -1 }`
- `{ role: 1, status: 1, lastActiveAt: -1 }`
- `{ "connectionRequests.from": 1, "connectionRequests.to": 1 }`
- `{ "connectionRequests.from": 1, "connectionRequests.to": 1, "connectionRequests.status": 1 }`

## 3. Conversations Collection
Model source: `backend/src/features/chat/chat.model.js`

Fields:
- `participants` (ObjectId[2], required, ref `User`)
- `participantsKey` (String, required, unique)
- `lastMessage` (ObjectId ref `Message`, nullable)
- `isActive` (Boolean, default `true`)
- `createdAt`, `updatedAt`

Indexes:
- `{ participants: 1 }`
- `{ updatedAt: -1 }`
- `participantsKey` unique index

## 4. Messages Collection
Model source: `backend/src/features/chat/chat.model.js`

Fields:
- `conversationId` (ObjectId ref `Conversation`, required)
- `senderId` (ObjectId ref `User`, required)
- `type` (`text | checkin | system | reminder | alert`)
- `content` (String)
- `metadata` (Mixed object)
- `seenBy` (ObjectId[] ref `User`)
- `createdAt`, `updatedAt`

Indexes:
- `{ conversationId: 1, createdAt: -1 }`
- `{ conversationId: 1, senderId: 1, createdAt: -1 }`

## 5. Relationship Summary
- One user can have many connection entries.
- One user can receive many connection requests.
- One conversation has exactly two participants.
- One conversation has many messages.
- One message belongs to one conversation.

## 6. Data Integrity Behaviors in Service Layer
Implemented behavior (application-level):
- Prevent self-connection requests.
- Avoid duplicate pending connection requests.
- Avoid duplicate daily check-ins.
- Idempotency patterns for selected chat operations.
- Match assignment conflict handling and recovery checks.

## 7. Recommended Schema Evolution (Phase 2)
1. Consider dedicated `connection_requests` collection for scale.
2. Add optional TTL/index strategy for transient message metadata (if needed).
3. Introduce migration/version fields for controlled schema evolution.
4. Add explicit audit fields (`updatedBy`, moderation actions) for trust/safety operations.
