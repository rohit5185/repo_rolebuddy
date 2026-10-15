# Database Schema — RoleBuddy

> Extracted from Mongoose model files. Documents current implementation only.
> Source: `backend/src/features/auth/auth.model.js`, `backend/src/features/chat/chat.model.js`, `backend/src/features/interview/interview.model.js`


---

## Models

### 1. User

**Collection**: `users`
**File**: `backend/src/features/auth/auth.model.js`
**Schema Options**: `{ timestamps: { createdAt: true, updatedAt: false }, versionKey: false }`

#### Fields

| Field                | Type               | Required | Default       | Constraints / Notes                                              |
|---------------------|--------------------|----------|---------------|------------------------------------------------------------------|
| `email`             | String             | Yes      | —             | unique, lowercase, trim                                         |
| `password`          | String             | Yes      | —             | minlength: 8                                                    |
| `role`              | String             | No       | `null`        | trim                                                            |
| `experience`        | String             | No       | `null`        | trim                                                            |
| `dailyGoal`         | Number             | No       | `null`        | values: 1, 2, 3 (enforced in service, not schema)              |
| `availability`      | String             | No       | `null`        | trim (legacy field, mirrors availabilityTime after onboarding) |
| `domain`            | String             | No       | `null`        | enum: ["tech", "non-tech"]; required if onboardingCompleted    |
| `domainArea`        | String             | Yes      | `"Unassigned"` | trim; derived from primaryArea (tech) or area (non-tech)      |
| `primaryArea`       | String             | No       | `null`        | trim; used when domain = "tech"                                 |
| `area`              | String             | No       | `null`        | trim; used when domain = "non-tech"                             |
| `specialization`    | String             | No       | `null`        | trim                                                            |
| `skills`            | [String]           | No       | `[]`          |                                                                  |
| `intent`            | String             | No       | `null`        | trim                                                            |
| `goal`              | String             | No       | `null`        | trim                                                            |
| `availabilityFrequency` | String         | No       | `null`        | trim                                                            |
| `availabilityTime`  | String             | No       | `null`        | enum: ["morning", "afternoon", "night"]                         |
| `preferences`       | [String]           | No       | `[]`          |                                                                  |
| `lastActiveAt`      | Date               | No       | `null`        | updated on dashboard load and check-in                         |
| `activeMatchExpiresAt` | Date             | No       | `null`        | active match expiry timestamp (48h lifecycle)                 |
| `lastMatchAt`       | Date               | No       | `null`        | timestamp of the most recent match assignment                 |
| `lastCheckInDate`   | Date               | No       | `null`        | date of most recent check-in                                   |
| `streakCount`       | Number             | No       | `0`           |                                                                  |
| `checkInHistory`    | [Object]           | No       | `[]`          | see sub-schema below                                            |
| `status`            | String             | No       | `"waiting"`   | enum: ["waiting", "matched"]                                    |
| `matchedUserId`     | ObjectId (ref: User) | No   | `null`        |                                                                  |
| `onboardingCompleted` | Boolean          | No       | `false`       |                                                                  |
| `displayName`       | String             | No       | —             | unique, sparse, trim; generated from role/specialization        |
| `connections`       | [Object]           | No       | `[]`          | see sub-schema below                                            |
| `connectionRequests` | [Object]          | No       | `[]`          | see sub-schema below                                            |
| `pendingMatchRequests` | [Object]        | No       | `[]`          | see sub-schema below; promotion requests from connections       |
| `createdAt`         | Date               | Auto     | —             | from timestamps option                                          |

#### Sub-schemas

**checkInHistory item**:
| Field    | Type   | Required | Notes                          |
|----------|--------|----------|--------------------------------|
| `date`   | Date   | Yes      |                                |
| `status` | String | Yes      | enum: ["done", "not_done"]     |

**connections item**:
| Field    | Type               | Required | Notes          |
|----------|--------------------|----------|----------------|
| `userId` | ObjectId (ref: User) | Yes   |                |

**connectionRequests item**:
| Field       | Type               | Required | Default     | Notes                              |
|-------------|--------------------|-----------|-----------|-------------------------------------|
| `from`      | ObjectId (ref: User) | Yes   | —           |                                    |
| `to`        | ObjectId (ref: User) | Yes   | —           |                                    |
| `status`    | String             | No        | `"pending"` | enum: ["pending", "accepted", "rejected"] |
| `createdAt` | Date               | No        | `Date.now`  |                                    |

**pendingMatchRequests item**:
| Field       | Type               | Required | Default     | Notes                              |
|-------------|--------------------|-----------|-----------|-------------------------------------|
| `from`      | ObjectId (ref: User) | Yes   | —           | user who sent promotion request    |
| `createdAt` | Date               | No        | `Date.now`  |                                    |

#### Indexes

| Index                                                             | Type      | Notes                                    |
|-------------------------------------------------------------------|-----------|------------------------------------------|
| `{ email: 1 }`                                                    | Unique    | from field definition                    |
| `{ displayName: 1 }`                                              | Unique, Sparse | from field definition               |
| `{ role: 1 }`                                                     | Single    |                                          |
| `{ domainArea: 1 }`                                               | Single    |                                          |
| `{ status: 1 }`                                                   | Single    |                                          |
| `{ lastActiveAt: -1 }`                                            | Single    |                                          |
| `{ activeMatchExpiresAt: 1 }`                                     | Single    | match expiry cleanup                     |
| `{ role: 1, status: 1, lastActiveAt: -1 }`                        | Compound  | primary matching index                   |
| `{ "connectionRequests.from": 1, "connectionRequests.to": 1 }`    | Compound  |                                          |
| `{ "connectionRequests.from": 1, "connectionRequests.to": 1, "connectionRequests.status": 1 }` | Compound | |
| `{ "pendingMatchRequests.from": 1 }`                              | Single    | promotion request lookup                 |


## User Additions (Professional Progress Foundation)

Fields added to the `User` schema by the professional progress system:

| Field                        | Type    | Default                | Notes                                                              |
|------------------------------|---------|------------------------|--------------------------------------------------------------------|
| `consistencyStreak`          | Number  | `0`                    | Consecutive calendar days with qualifying activity                 |
| `lastActiveDay`              | String  | `null`                 | UTC date string `YYYY-MM-DD` of last tracked active day            |
| `contributionCount`          | Number  | `0`                    | Total cumulative contributions across all types                    |
| `completedMockInterviews`    | Number  | `0`                    | Count of completed mock interviews                                 |
| `completedExchanges`         | Number  | `0`                    | Count of completed interview experience exchanges                  |
| `completedSensitiveExchanges`| Number  | `0`                    | Count of completed mutual sensitive exchanges                      |
| `totalAcceptedCommitments`   | Number  | `0`                    | Total commitments accepted (exchange accepts, etc.)                |
| `completedCommitments`       | Number  | `0`                    | Commitments successfully completed                                 |
| `reliabilityScore`           | Number  | `null`                 | Derived: `(completedCommitments / totalAcceptedCommitments) * 100`|
| `reliabilityLabel`           | String  | `null`                 | `"Highly Reliable"` (90–100), `"Reliable"` (80–89), or `null`    |
| `preparationStatus`          | String  | `"Starting Preparation"` | enum: `["Starting Preparation", "Preparing Actively", "Interview Ready"]` |
| `googleCalendar.connected`   | Boolean | `false`                | Whether Google Calendar OAuth is connected                                  |
| `googleCalendar.accessToken` | String  | `null`                 | OAuth access token                                                          |
| `googleCalendar.refreshToken`| String  | `null`                 | OAuth refresh token                                                         |
| `googleCalendar.expiryDate`  | Date    | `null`                 | Access token expiry                                                         |
| `googleCalendar.scope`       | String  | `null`                 | Granted OAuth scopes                                                        |

### Qualifying Active Day Events

An active day (`consistencyStreak` / `lastActiveDay`) is tracked when a user:
- Sends a connection request
- Accepts a connection request
- Sends at least one chat message

### Contribution Events

`contributionCount` increments when a user:
- Completes an `interview_experience` exchange
- Completes a mutual sensitive exchange

### Reliability Labels

- Under 3 total commitments: no label shown
- 90–100: `"Highly Reliable"`
- 80–89: `"Reliable"`
- Below 80: no label

### Preparation Status Rules

- **Interview Ready**: ≥5 contributions AND ≥1 mock interview AND streak ≥14
- **Preparing Actively**: ≥1 contribution AND streak ≥3
- **Starting Preparation**: 0 contributions OR streak <3

---

---

### 2. Conversation

**Collection**: `conversations`
**File**: `backend/src/features/chat/chat.model.js`
**Schema Options**: `{ timestamps: true, versionKey: false }`

#### Fields

| Field              | Type               | Required | Default | Constraints / Notes                                          |
|--------------------|--------------------|----------|---------|--------------------------------------------------------------|
| `participants`     | [ObjectId (ref: User)] | Yes | —    | Must have exactly 2 participants (validator enforced)       |
| `participantsKey`  | String             | Yes      | —       | unique, indexed; select: false (excluded from default queries) |
| `lastMessage`      | ObjectId (ref: Message) | No | `null` |                                                           |
| `isActive`         | Boolean            | No       | `true`  |                                                              |
| `createdAt`        | Date               | Auto     | —       |                                                              |
| `updatedAt`        | Date               | Auto     | —       |                                                              |

#### Indexes

| Index                       | Type   | Notes                                |
|-----------------------------|--------|--------------------------------------|
| `{ participantsKey: 1 }`    | Unique | from field definition                |
| `{ participants: 1 }`       | Single |                                      |
| `{ updatedAt: -1 }`         | Single |                                      |

---

### 3. Message

**Collection**: `messages`
**File**: `backend/src/features/chat/chat.model.js`
**Schema Options**: `{ timestamps: true, versionKey: false }`

#### Fields

| Field            | Type               | Required | Default  | Constraints / Notes                                              |
|------------------|--------------------|----------|----------|------------------------------------------------------------------|
| `conversationId` | ObjectId (ref: Conversation) | Yes | — | indexed                                                      |
| `senderId`       | ObjectId (ref: User) | Yes   | —        | indexed                                                          |
| `type`           | String             | No       | `"text"` | enum: `["text", "checkin", "system", "reminder", "alert", "interview_request", "interview_system", "interview_question", "interview_answer", "interview_feedback"]` |
| `content`        | String             | No       | `""`     | trim                                                             |
| `metadata`       | Mixed              | No       | `{}`     | schema-less; used for type-specific payload                     |
| `seenBy`         | [ObjectId (ref: User)] | No  | `[]`     |                                                                  |
| `createdAt`      | Date               | Auto     | —        |                                                                  |
| `updatedAt`      | Date               | Auto     | —        |                                                                  |

#### Indexes

| Index                                                  | Type     | Notes                              |
|--------------------------------------------------------|----------|------------------------------------|
| `{ conversationId: 1 }`                                | Single   | from field definition              |
| `{ senderId: 1 }`                                      | Single   | from field definition              |
| `{ conversationId: 1, createdAt: -1 }`                 | Compound | message listing with pagination    |
| `{ conversationId: 1, senderId: 1, createdAt: -1 }`    | Compound |                                    |

---

## Relationships

```
User ─────────────────────────────────────────────────────────
  │  matchedUserId → User                  (1:1, self-ref)
  │  connections[].userId → User           (M:M via embedded array)
  │  connectionRequests[].from → User      (M:M via embedded array)
  │  connectionRequests[].to → User        (M:M via embedded array)

Conversation ──────────────────────────────────────────────────
  │  participants[0,1] → User             (exactly 2 per conversation)
  │  lastMessage → Message                (1:1)

Message ────────────────────────────────────────────────────────
  │  conversationId → Conversation        (M:1)
  │  senderId → User                      (M:1)
  │  seenBy[] → User                      (M:M via embedded array)
```

---

## Domain Logic Notes

### domainArea Derivation

- **tech domain**: `domainArea = primaryArea`
- **non-tech domain**: `domainArea = area`
- **fallback**: `"Unassigned"` (backfill migration runs on startup)

### Matching Eligibility

A user is eligible as a match candidate if:
- `onboardingCompleted: true`
- `lastActiveAt >= now - 24h`
- no active match (`activeMatchExpiresAt` is missing/null or already expired)
- `_id != requester._id`

Active matches are time-bound:
- active if `matchedUserId` is set and `activeMatchExpiresAt > now`
- expired if `activeMatchExpiresAt <= now`, `activeMatchExpiresAt` is missing, or the partner has been inactive for 48h

### Connection Request Deduplication

- Embedded array storage is retained (no separate collection yet)
- Duplicate pending requests are prevented at write time and resolved idempotently
- Accept/reject resolves pending requests for the pair and keeps state consistent for both-direction checks
- `connections[]` is guarded against duplicates before insert

### displayName Format

Format: `<specialization|role|"User"><NN>` where NN is a random 2-digit number.
Uniqueness enforced at DB level (unique sparse index) and service level (retry loop up to 5 attempts).

### participantsKey (Conversation)

A deterministic string derived from sorted participant IDs to ensure exactly one conversation per pair.
Not selected by default (`select: false`).

---

## 4. Exchange

**Collection**: `exchanges`
**File**: `backend/src/features/exchange/exchange.model.js`
**Schema Options**: `{ timestamps: true, versionKey: false }`

#### Fields

| Field                      | Type     | Required | Default         | Constraints / Notes                                                  |
|----------------------------|----------|----------|-----------------|----------------------------------------------------------------------|
| `participants`             | [Object] | Yes      | —               | Exactly 2 entries (validator enforced); see sub-schema below        |
| `exchangeType`             | String   | Yes      | —               | enum: `["role_experience", "interview_experience", "sensitive_exchange"]`; trim |
| `status`                   | String   | No       | `"requested"`   | enum: `["requested", "active", "completed", "cancelled", "reported"]`; trim |
| `permissionLayer`          | String   | No       | `"compatibility"` | enum: `["compatibility", "professional", "sensitive"]`; trim       |
| `unlockState.professionalUnlocked` | Boolean | No | `false`       | true when both participants have `approvedProfessionalUnlock: true` |
| `unlockState.sensitiveUnlocked`    | Boolean | No | `false`       | true when both participants have `approvedSensitiveUnlock: true`    |
| `relevance.score`          | Number   | Yes      | —               | 0–100 compatibility score snapshot at request time                  |
| `relevance.category`       | String   | Yes      | —               | trim                                                                 |
| `capability.score`         | Number   | Yes      | —               |                                                                      |
| `capability.category`      | String   | Yes      | —               | trim                                                                 |
| `capability.warnings`      | [String] | No       | `[]`            |                                                                      |
| `reciprocity.score`        | Number   | Yes      | —               |                                                                      |
| `reciprocity.category`     | String   | Yes      | —               | trim                                                                 |
| `trustSnapshot.initiatorTier`       | String | Yes | —            | trim; snapshot of trust tier at request time                        |
| `trustSnapshot.targetTier`          | String | Yes | —            | trim                                                                 |
| `trustSnapshot.initiatorReputation` | String | Yes | —            | trim                                                                 |
| `trustSnapshot.targetReputation`    | String | Yes | —            | trim                                                                 |
| `contextualWarnings`       | [String] | No       | `[]`            |                                                                      |
| `pendingSensitiveTemplates`| Mixed    | No       | `{}`            | Keyed by userId string; stores submitted sensitive templates until both sides submit; cleared on mutual reveal |
| `lastSensitiveSharedAt`    | Date     | No       | `null`          | Set after a mutual sensitive reveal; enforces 24h cooldown          |
| `lifecycleLog`             | [Object] | No       | `[]`            | Append-only audit log; see sub-schema below                         |
| `createdAt`                | Date     | Auto     | —               | from timestamps option                                               |
| `updatedAt`                | Date     | Auto     | —               | from timestamps option                                               |

#### Sub-schemas

**exchangeParticipant item** (`participants[]`):

| Field                      | Type               | Required | Default | Notes                                         |
|----------------------------|--------------------|----------|---------|-----------------------------------------------|
| `userId`                   | ObjectId (ref: User) | Yes    | —       |                                               |
| `approvedProfessionalUnlock` | Boolean          | No       | `false` | Set to `true` on accept; initiator starts `true` |
| `approvedSensitiveUnlock`  | Boolean            | No       | `false` | Set to `true` on sensitive unlock approval    |

`_id: false` on sub-schema.

**lifecycleLog item**:

| Field       | Type               | Required | Default    | Notes                                        |
|-------------|--------------------|----------|------------|----------------------------------------------|
| `action`    | String             | Yes      | —          | trim; e.g. `"exchange_requested"`, `"exchange_accepted"`, `"sensitive_unlock_approved"`, `"exchange_entry_shared"`, `"sensitive_info_submitted"`, `"sensitive_info_shared"`, `"exchange_completed"`, `"exchange_reported"` |
| `actorId`   | ObjectId (ref: User) | Yes   | —          |                                              |
| `metadata`  | Mixed              | No       | `{}`       | Action-specific context                      |
| `createdAt` | Date               | No       | `Date.now` |                                              |

#### Indexes

| Index                                                     | Type     | Notes                                          |
|-----------------------------------------------------------|----------|------------------------------------------------|
| `{ "participants.userId": 1, status: 1, createdAt: -1 }` | Compound | Primary exchange lookup per participant        |
| `{ permissionLayer: 1, status: 1, createdAt: -1 }`       | Compound |                                                |
| `{ exchangeType: 1, status: 1, createdAt: -1 }`          | Compound |                                                |
| `{ "unlockState.sensitiveUnlocked": 1, status: 1 }`      | Compound | Sensitive-layer queries                        |

---

## 5. ExchangeEntry

**Collection**: `exchangeentries`
**File**: `backend/src/features/exchange/exchange.model.js`
**Schema Options**: `{ timestamps: true, versionKey: false }`

#### Fields

| Field             | Type               | Required | Default | Constraints / Notes                                    |
|-------------------|--------------------|----------|---------|--------------------------------------------------------|
| `exchangeId`      | ObjectId (ref: Exchange) | Yes | —      | indexed                                                |
| `authorId`        | ObjectId (ref: User) | Yes   | —       | indexed                                                |
| `entryType`       | String             | Yes      | —       | enum: `["role", "interview", "sensitive"]`; trim       |
| `visibilityLayer` | String             | Yes      | —       | enum: `["professional", "sensitive"]`; trim            |
| `content`         | String             | Yes      | —       | trim                                                   |
| `metadata`        | Mixed              | No       | `{}`    | schema-less; additional context                        |
| `isReported`      | Boolean            | No       | `false` |                                                        |
| `createdAt`       | Date               | Auto     | —       | from timestamps option                                 |
| `updatedAt`       | Date               | Auto     | —       | from timestamps option                                 |

#### Indexes

| Index                                                | Type     | Notes                            |
|------------------------------------------------------|----------|----------------------------------|
| `{ exchangeId: 1, createdAt: -1 }`                  | Compound | from field definition + explicit |
| `{ exchangeId: 1, visibilityLayer: 1, createdAt: -1 }` | Compound | visibility-filtered listing   |
| `{ authorId: 1, createdAt: -1 }`                    | Compound | from field definition + explicit |

---

## User Additions (Trust/Exchange)

Fields added to the `User` schema by the exchange and trust systems:

| Field                    | Type    | Default       | Notes                                                           |
|--------------------------|---------|---------------|-----------------------------------------------------------------|
| `trustTier`              | String  | `"unverified"`| enum: `["unverified", "consistent", "trusted", "high_trust"]`  |
| `exchangeReputation`     | String  | `"neutral"`   | enum: `["neutral", "valuable", "highly_valuable"]`              |
| `successfulExchangeCount`| Number  | `0`           | Incremented on exchange completion                              |
| `reportCount`            | Number  | `0`           | Incremented when user is reported                               |
| `abuseIncidentCount`     | Number  | `0`           | Incremented when user is reported                               |
| `exchangeStats.requestsSent`       | Number | `0` |                                                               |
| `exchangeStats.requestsAccepted`   | Number | `0` |                                                               |
| `exchangeStats.entriesShared`      | Number | `0` |                                                               |
| `exchangeStats.completedExchanges` | Number | `0` |                                                               |
| `exchangeStats.sensitiveUnlockApproved` | Number | `0` |                                                          |
| `exchangeStats.reportedByPeers`    | Number | `0` |                                                               |
| `capabilitySignals.activityConsistencyScore` | Number | — | Cached; refreshed on trust recalculation                |
| `capabilitySignals.lastEvaluatedAt`          | Date   | — |                                                          |

### exchangeProfile sub-document

| Field                | Type   | Notes                                                                      |
|----------------------|--------|----------------------------------------------------------------------------|
| `lastJobExperience`  | String | Free text; legacy fallback                                                 |
| `lastInterviewExperience` | String | Free text; legacy fallback                                          |
| `roleTransitionNotes`| String | Free text                                                                  |
| `verificationStatus` | String | enum: `["not_submitted", "pending", "verified", "unverified"]`             |
| `verificationSource` | String | enum: `["community_consistency", "reputation_system"]`                     |
| `submittedAt`        | Date   | Set on each `PUT /api/exchanges/profile`                                   |
| `reviewedAt`         | Date   | Set when verification resolves                                             |
| `roleTemplate`       | Object | Domain-agnostic role experience template (see fields below)                |
| `interviewTemplate`  | Object | Domain-agnostic interview experience template (see fields below)           |

**roleTemplate fields:** `roleTitle`, `industryCompanyType`, `companyType`, `experienceLevel`, `mainResponsibilities`, `typicalWorkflow`, `toolsMethodsUsed`, `skillsRequired`, `mostImportantSkills`, `whatMattersToSucceed`, `whatHelpedMost`, `biggestMistakesToAvoid`, `difficultyEnteringRole`, `adviceForSomeoneStartingToday`, plus legacy: `companyContext`, `responsibilities[]`, `workflow`, `requiredSkills[]`, `preparationStrategy`

**interviewTemplate fields:** `roleInterviewedFor`, `industryCompanyType`, `companyType`, `experienceLevelTargeted`, `experienceLevel`, `interviewDateOptional`, `numberOfRounds`, `roundTypes`, `overallDifficulty`, `totalProcessDuration`, `mainTopicsEvaluated`, `notableQuestionsOrTasks`, `ifRejectedLikelyReasonOptional`, `whatYouWouldDoDifferently`, `finalAdviceForOthers`, `whatHelpedMost`, plus legacy: `roleTitle`, `companyContext`, `rounds`, `questionsTopics[]`, `difficulty`, `outcome`, `preparationAdvice`, `rejectionReasons`

---

## Domain Logic Notes (Exchange)

### Permission Layer Progression

```
compatibility → professional → sensitive
```

- `compatibility`: exchange created (`requested` status), initiator approved, partner has not yet accepted
- `professional`: both participants have `approvedProfessionalUnlock: true` (`status: "active"`); professional entries and templates are visible
- `sensitive`: both participants have `approvedSensitiveUnlock: true`; requires relevance score ≥ 50; enables sensitive-layer entries and the sensitive-info sharing flow

### Sensitive Sharing (Two-Phase Mutual Reveal)

1. Both participants approve sensitive unlock (dual approval)
2. Either participant submits their template via `POST /api/exchanges/:exchangeId/share-sensitive`
3. Template stored in `pendingSensitiveTemplates[userId]`
4. When second participant submits, both templates are simultaneously posted to chat as system messages
5. `pendingSensitiveTemplates` cleared; `lastSensitiveSharedAt` stamped (enforces 24h cooldown)
6. Template data is **never** persisted to `exchangeProfile`

### Template Completion Check

A `roleTemplate` is considered "filled" if it has `roleTitle` **and** at least one of: `mainResponsibilities`, `typicalWorkflow`, `toolsMethodsUsed`, `whatHelpedMost`, `adviceForSomeoneStartingToday`, `responsibilities[]`, `workflow`, `preparationStrategy`.

An `interviewTemplate` is considered "filled" if it has `roleInterviewedFor`/`roleTitle` **and** at least one of: `roundTypes`, `numberOfRounds`, `mainTopicsEvaluated`, `notableQuestionsOrTasks`, `preparationAdvice`, `whatHelpedMost`, `rounds`, `outcome`, `overallDifficulty`, `finalAdviceForOthers`, `questionsTopics[]`.

### Exchange Relationships

```
Exchange ─────────────────────────────────────────────────────
  │  participants[].userId → User        (exactly 2 per exchange)
  │  lifecycleLog[].actorId → User       (audit actor)

ExchangeEntry ──────────────────────────────────────────────────
  │  exchangeId → Exchange               (M:1)
  │  authorId → User                     (M:1)

InterviewSession ───────────────────────────────────────────────
  │  conversationId → Conversation       (M:1)
  │  interviewerId → User                (M:1)
  │  candidateId → User                  (M:1)
  │  templateId → InterviewTemplate      (M:1)
```

---

## 6. InterviewTemplate

**Collection**: `interviewtemplates`
**File**: `backend/src/features/interview/interview.model.js`
**Schema Options**: `{ timestamps: true, versionKey: false }`

#### Fields

| Field               | Type     | Required | Default | Constraints / Notes                                                  |
|---------------------|----------|----------|---------|----------------------------------------------------------------------|
| `title`             | String   | Yes      | —       | trim                                                                 |
| `domain`            | String   | Yes      | —       | enum: `["tech", "non-tech", "any"]`; trim                           |
| `role`              | String   | No       | `null`  | trim; optional role filter                                           |
| `type`              | String   | Yes      | —       | enum: `["technical", "hr", "behavioral", "mixed", "resume_round"]`  |
| `difficulty`        | String   | Yes      | —       | enum: `["beginner", "intermediate", "advanced"]`                    |
| `question`       | String   | Yes      | —        | trim                                              |
| `type`           | String   | No       | `"open"` | enum: `["open", "technical", "behavioral", "situational"]` |
| `followUps`      | [String] | No       | `[]`     | shown only to the interviewer                     |
| `expectedTopics` | [String] | No       | `[]`     | shown only to the interviewer                     |
| `notes`          | String   | No       | `null`   | optional interviewer notes                         |

`_id` not suppressed (default sub-schema).

#### Indexes

| Index                              | Type     | Notes                          |
|------------------------------------|----------|--------------------------------|
| `{ domain: 1, type: 1, isActive: 1 }` | Compound | Primary template query     |
| `{ role: 1, isActive: 1 }`        | Compound | Role-filtered template query   |
| `{ createdBy: 1, isActive: 1, createdAt: -1 }` | Compound | owner template listing |
| `{ visibility: 1, isActive: 1, domain: 1, type: 1 }` | Compound | public/private discovery |

---

## 7. InterviewSession

**Collection**: `interviewsessions`
**File**: `backend/src/features/interview/interview.model.js`
**Schema Options**: `{ timestamps: true, versionKey: false }`

#### Fields

| Field                    | Type                         | Required | Default  | Constraints / Notes                                                  |
|--------------------------|------------------------------|----------|----------|----------------------------------------------------------------------|
| `conversationId`         | ObjectId (ref: Conversation) | Yes      | —        | indexed                                                              |
| `interviewerId`          | ObjectId (ref: User)         | Yes      | —        | indexed                                                              |
| `candidateId`            | ObjectId (ref: User)         | Yes      | —        | indexed                                                              |
| `templateId`             | ObjectId (ref: InterviewTemplate) | Yes | —        |                                                                      |
| `mode`                   | String                       | No       | `"text_async"` | enum: `["text_async", "live_online", "live_video"]`                 |
| `scheduleStatus`         | String                       | No       | `null` | enum: `["proposed", "confirmed", "missed", "completed", "cancelled"]` |
| `proposedSlots`          | [Date]                       | No       | `[]` | UTC slots (2–3 values for live-online scheduling) |
| `confirmedSlot`          | Date                         | No       | `null` | Selected UTC slot for live-online |
| `timezoneHint`           | String                       | No       | `null` | IANA timezone used by proposer |
| `googleCalendar`         | Object                       | No       | `{}` | eventId/link per participant where available |
| `status`                 | String                       | No       | `"pending"` | enum: `["pending", "active", "paused", "completed", "cancelled"]` |
| `currentQuestionIndex`   | Number                       | No       | `0`      | 0-based index of next question to send                              |
| `totalQuestions`         | Number                       | Yes      | —        | snapshot of template question count at session creation             |
| `finalRatings`           | Object                       | No       | `{}`     | see sub-schema below                                                 |
| `overallFeedback`        | String                       | No       | `null`   | trim; written feedback from interviewer                             |
| `startedAt`              | Date                         | No       | `null`   | set when status becomes `"active"`                                  |
| `endedAt`                | Date                         | No       | `null`   | set when status becomes `"completed"` or `"cancelled"`              |
| `createdAt`              | Date                         | Auto     | —        |                                                                      |
| `updatedAt`              | Date                         | Auto     | —        |                                                                      |

#### Sub-schema: `finalRatings`

| Field            | Type   | Range | Notes          |
|------------------|--------|-------|----------------|
| `communication`  | Number | 1–5   | optional       |
| `technical`      | Number | 1–5   | optional       |
| `problemSolving` | Number | 1–5   | optional       |
| `overall`        | Number | 1–5   | optional       |

`_id: false` on sub-schema.

#### Indexes

| Index                                                  | Type     | Notes                                      |
|--------------------------------------------------------|----------|--------------------------------------------|
| `{ conversationId: 1, status: 1 }`                    | Compound | Active session lookup per conversation     |
| `{ interviewerId: 1, status: 1, createdAt: -1 }`      | Compound | Interviewer session history                |
| `{ candidateId: 1, status: 1, createdAt: -1 }`        | Compound | Candidate session history                  |

---

## Session + Message Type Mapping

Interview sessions produce `Message` documents with the following types:

| Message Type           | Produced By                        | Visible To   |
|------------------------|------------------------------------|--------------|
| `interview_request`    | `createInterviewRequest()`         | Both         |
| `interview_system`     | `acceptInterview()`, `declineInterview()`, `completeInterview()` | Both |
| `interview_question`   | `sendQuestion()`                   | Both (follow-ups interviewer-only in UI) |
| `interview_answer`     | `submitAnswer()`                   | Both         |
| `interview_feedback`   | `submitFeedback()`                 | Both         |

All interview messages are stored in the standard `messages` collection and appear in the conversation timeline alongside normal `text`, `checkin`, `alert`, and `system` messages.
