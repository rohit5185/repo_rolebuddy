Exchange Types
role_experience

Structured role knowledge:

responsibilities
workflow
expectations
required skills
preparation strategy
interview_experience

Interview-specific knowledge:

rounds
questions
difficulty
preparation path
rejection reasons
selection insights
sensitive_exchange

Sensitive professional data:

HR contacts
recruiter paths
internal processes
referral information

Requires additional unlock.

Exchange Lifecycle
Step 1 — Exchange Request

User initiates:

role exchange
or
interview exchange

System calculates:

relevance score
capability score
reciprocity prediction
Step 2 — Warning Layer

If imbalance exists:

lower experience
low reputation
different role

System shows contextual warning.

Example:
"This user currently has limited verified exchange value."

No hard block.

Step 3 — Mutual Approval

Target user accepts:

exchange request
optional reciprocal share

Once both accept:

structured exchange unlocks
Step 4 — Sensitive Unlock

Optional secondary unlock.

Both users must explicitly approve.

Capability Scoring

Capability is derived from:

same role match
same specialization
experience proximity
trust tier
exchange reputation
successful exchange history

Capability categories:

low
medium
high
equivalent

Used only for:

warnings
unlock guidance
sensitive eligibility

Never for hard denial.

Trust System
Trust Tier Calculation

Signals:

account age
onboarding consistency
activity consistency
exchange success rate
peer reports
exchange completion rate
abuse incidents

Trust tiers:

unverified
consistent
trusted
high_trust
Reputation System

Separate from trust.

Reputation reflects:

usefulness of exchanges
reciprocity quality
peer feedback

Reputation categories:

neutral
valuable
highly_valuable
Database Changes
User Model Additions
trustTier
exchangeReputation
exchangeStats
successfulExchangeCount
reportCount
capabilitySignals
New Exchange Collection
Exchange

Fields:

participants
exchangeType
status
permissionLayer
capabilitySnapshot
trustSnapshot
unlockState
sensitiveUnlocked
createdAt
updatedAt
New ExchangeEntry Collection

Stores structured exchanged data.

Types:

role
interview
sensitive
UI Architecture
Chat-Level Exchange Bar

Inside chat:

Exchange Experience button
Role Experience
Interview Experience
Sensitive Unlock
Exchange Drawer

Mobile-first sliding panel.

Contains:

trust indicators
reciprocity indicators
exchange state
unlock controls
warnings
Trust Badges

Minimal professional UI:

Consistent
Trusted
High Trust

Avoid gamification aesthetics.

Scalability Considerations
Capability computed dynamically with cache
Exchange entries paginated
Sensitive data encrypted at rest
Trust scoring async/background capable
Abuse reporting extensible
Security Considerations
Sensitive unlock requires dual approval
No public indexing of sensitive data
Exchange visibility limited to participants
Reports trigger trust reduction
Exchange actions auditable
Product Guardrails
No public interview feed
No open sharing marketplace
No anonymous mass posting
No auto-sensitive unlock
No extraction-only interaction patterns
No feed-style engagement loops