import mongoose from "mongoose";

import { AppError } from "../../utils/appError.js";
import { User } from "../auth/auth.model.js";
import {
  buildContextualWarnings,
  calculateCapabilityScore,
  calculateRelevanceScore,
  evaluateReciprocity
} from "../capability/capability.service.js";
import { calculateExchangeReputation, calculateTrustTier } from "../trust/trust.service.js";
import { evaluateExchangeProfileVerification, getCommunityConsistencySignals } from "../verification/verification.service.js";
import { emitToUser } from "../chat/chat.realtime.js";
import { createConversationIfNotExists, postSystemMessage } from "../chat/chat.service.js";
import { Exchange, ExchangeEntry } from "./exchange.model.js";
import { incrementContributionForAll, incrementAcceptedCommitments, incrementCompletedCommitments } from "../contribution/contribution.service.js";

function toObjectId(value, message = "Invalid identifier.") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400);
  }

  return new mongoose.Types.ObjectId(value);
}

function serializeExchange(exchange, currentUserId) {
  const currentParticipant = exchange.participants.find((p) => String(p.userId) === String(currentUserId));
  const partnerParticipant = exchange.participants.find((p) => String(p.userId) !== String(currentUserId));

  return {
    id: String(exchange._id),
    participants: exchange.participants.map((participant) => String(participant.userId)),
    exchangeType: exchange.exchangeType,
    status: exchange.status,
    permissionLayer: exchange.permissionLayer,
    unlockState: exchange.unlockState,
    relevance: exchange.relevance,
    capability: exchange.capability,
    reciprocity: exchange.reciprocity,
    contextualWarnings: exchange.contextualWarnings,
    trustSnapshot: exchange.trustSnapshot,
    approvals: {
      professional: {
        self: Boolean(currentParticipant?.approvedProfessionalUnlock),
        partner: Boolean(partnerParticipant?.approvedProfessionalUnlock)
      },
      sensitive: {
        self: Boolean(currentParticipant?.approvedSensitiveUnlock),
        partner: Boolean(partnerParticipant?.approvedSensitiveUnlock)
      }
    },
    createdAt: exchange.createdAt,
    updatedAt: exchange.updatedAt
  };
}

function serializeEntry(entry) {
  return {
    id: String(entry._id),
    exchangeId: String(entry.exchangeId),
    authorId: String(entry.authorId),
    entryType: entry.entryType,
    visibilityLayer: entry.visibilityLayer,
    content: entry.content,
    metadata: entry.metadata ?? {},
    createdAt: entry.createdAt
  };
}

async function getUserPairOrFail(initiatorId, targetUserId) {
  const [initiator, target] = await Promise.all([
    User.findById(initiatorId).lean(),
    User.findById(targetUserId).lean()
  ]);

  if (!initiator || !target) {
    throw new AppError("User not found.", 404);
  }

  if (!initiator.onboardingCompleted || !target.onboardingCompleted) {
    throw new AppError("Both users must complete onboarding before exchange.", 400);
  }

  const connected =
    (initiator.connections ?? []).some((item) => String(item.userId) === String(target._id)) ||
    (target.connections ?? []).some((item) => String(item.userId) === String(initiator._id));

  const matched =
    String(initiator.matchedUserId ?? "") === String(target._id) ||
    String(target.matchedUserId ?? "") === String(initiator._id);

  if (!connected && !matched) {
    throw new AppError("Professional exchange is only allowed with matched or connected users.", 403);
  }

  return { initiator, target };
}

async function getExchangeWithAccessOrFail(exchangeId, userId) {
  const exchange = await Exchange.findById(exchangeId).lean();

  if (!exchange) {
    throw new AppError("Exchange not found.", 404);
  }

  const allowed = exchange.participants.some((p) => String(p.userId) === String(userId));
  if (!allowed) {
    throw new AppError("You do not have access to this exchange.", 403);
  }

  return exchange;
}

async function refreshUserTrust(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return;

  const trust = calculateTrustTier(user);
  const reputation = calculateExchangeReputation(user);
  const signals = getCommunityConsistencySignals(user);
  const verification = evaluateExchangeProfileVerification({ ...user, trustTier: trust.trustTier, exchangeReputation: reputation });

  const verificationUpdate =
    (user.exchangeProfile?.verificationStatus ?? "not_submitted") === "pending" && verification.status !== "pending"
      ? {
          "exchangeProfile.verificationStatus": verification.status,
          "exchangeProfile.reviewedAt": new Date(),
          "exchangeProfile.verificationSource": verification.status === "verified" ? "reputation_system" : "community_consistency"
        }
      : {};

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        trustTier: trust.trustTier,
        exchangeReputation: reputation,
        "capabilitySignals.activityConsistencyScore": signals.activityConsistency,
        "capabilitySignals.lastEvaluatedAt": new Date(),
        ...verificationUpdate
      }
    }
  );
}

function getExpectedEntryType(exchangeType) {
  if (exchangeType === "role_experience") return "role";
  if (exchangeType === "interview_experience") return "interview";
  return null;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function trimOrNull(value) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function normalizeRoleTemplatePayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  return {
    roleTitle: trimOrNull(payload.roleTitle),
    industryCompanyType: trimOrNull(payload.industryCompanyType),
    companyType: trimOrNull(payload.companyType),
    experienceLevel: trimOrNull(payload.experienceLevel),
    mainResponsibilities: trimOrNull(payload.mainResponsibilities),
    typicalWorkflow: trimOrNull(payload.typicalWorkflow),
    toolsMethodsUsed: trimOrNull(payload.toolsMethodsUsed),
    skillsRequired: trimOrNull(payload.skillsRequired),
    mostImportantSkills: trimOrNull(payload.mostImportantSkills),
    whatMattersToSucceed: trimOrNull(payload.whatMattersToSucceed),
    whatHelpedMost: trimOrNull(payload.whatHelpedMost),
    biggestMistakesToAvoid: trimOrNull(payload.biggestMistakesToAvoid),
    difficultyEnteringRole: trimOrNull(payload.difficultyEnteringRole),
    adviceForSomeoneStartingToday: trimOrNull(payload.adviceForSomeoneStartingToday),
    companyContext: trimOrNull(payload.companyContext),
    responsibilities: toStringArray(payload.responsibilities),
    workflow: trimOrNull(payload.workflow),
    requiredSkills: toStringArray(payload.requiredSkills),
    preparationStrategy: trimOrNull(payload.preparationStrategy)
  };
}

function normalizeInterviewTemplatePayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const roleInterviewedFor = trimOrNull(payload.roleInterviewedFor ?? payload.roleTitle);
  const roleTitleLegacy = trimOrNull(payload.roleTitle ?? payload.roleInterviewedFor);
  return {
    roleInterviewedFor,
    industryCompanyType: trimOrNull(payload.industryCompanyType),
    companyType: trimOrNull(payload.companyType),
    experienceLevelTargeted: trimOrNull(payload.experienceLevelTargeted),
    experienceLevel: trimOrNull(payload.experienceLevel),
    interviewDateOptional: trimOrNull(payload.interviewDateOptional),
    numberOfRounds: trimOrNull(payload.numberOfRounds),
    roundTypes: trimOrNull(payload.roundTypes),
    overallDifficulty: trimOrNull(payload.overallDifficulty),
    totalProcessDuration: trimOrNull(payload.totalProcessDuration),
    mainTopicsEvaluated: trimOrNull(payload.mainTopicsEvaluated),
    notableQuestionsOrTasks: trimOrNull(payload.notableQuestionsOrTasks),
    ifRejectedLikelyReasonOptional: trimOrNull(payload.ifRejectedLikelyReasonOptional),
    whatYouWouldDoDifferently: trimOrNull(payload.whatYouWouldDoDifferently),
    finalAdviceForOthers: trimOrNull(payload.finalAdviceForOthers),
    roleTitle: roleTitleLegacy,
    companyContext: trimOrNull(payload.companyContext),
    rounds: trimOrNull(payload.rounds),
    questionsTopics: toStringArray(payload.questionsTopics),
    difficulty: trimOrNull(payload.difficulty),
    outcome: trimOrNull(payload.outcome),
    preparationAdvice: trimOrNull(payload.preparationAdvice),
    rejectionReasons: trimOrNull(payload.rejectionReasons),
    whatHelpedMost: trimOrNull(payload.whatHelpedMost)
  };
}

function hasRoleTemplate(profile) {
  const tpl = profile?.roleTemplate;
  if (!tpl?.roleTitle) return false;
  const hasNew = Boolean(
    tpl.mainResponsibilities ||
      tpl.typicalWorkflow ||
      tpl.toolsMethodsUsed ||
      tpl.whatHelpedMost ||
      tpl.adviceForSomeoneStartingToday
  );
  const hasLegacy = Boolean(
    (tpl.responsibilities && tpl.responsibilities.length) || tpl.workflow || tpl.preparationStrategy
  );
  return hasNew || hasLegacy;
}

function hasInterviewTemplate(profile) {
  const tpl = profile?.interviewTemplate;
  const title = tpl?.roleInterviewedFor || tpl?.roleTitle;
  if (!title) return false;
  const hasNew = Boolean(
    tpl.roundTypes ||
      tpl.numberOfRounds ||
      tpl.mainTopicsEvaluated ||
      tpl.notableQuestionsOrTasks ||
      tpl.preparationAdvice ||
      tpl.whatHelpedMost ||
      tpl.rounds ||
      tpl.outcome ||
      tpl.overallDifficulty ||
      tpl.finalAdviceForOthers
  );
  const hasLegacy = Boolean(tpl.rounds || tpl.questionsTopics?.length);
  return hasNew || hasLegacy;
}

export async function createExchangeRequest(userId, payload) {
  const initiatorId = toObjectId(userId);
  const targetUserId = toObjectId(payload?.targetUserId, "Invalid target user id.");

  if (String(initiatorId) === String(targetUserId)) {
    throw new AppError("You cannot create an exchange with yourself.", 400);
  }

  const exchangeType = String(payload?.exchangeType ?? "").trim();
  if (!["role_experience", "interview_experience"].includes(exchangeType)) {
    throw new AppError("Invalid exchange type.", 400);
  }

  const { initiator, target } = await getUserPairOrFail(initiatorId, targetUserId);
  if (exchangeType === "role_experience" && !hasRoleTemplate(initiator.exchangeProfile)) {
    throw new AppError("Please save your Role Experience template first.", 400);
  }
  if (exchangeType === "interview_experience" && !hasInterviewTemplate(initiator.exchangeProfile)) {
    throw new AppError("Please save your Interview Experience template first.", 400);
  }

  const existing = await Exchange.findOne({
    exchangeType,
    status: { $in: ["requested", "active"] },
    "participants.userId": { $all: [initiatorId, targetUserId] }
  })
    .sort({ updatedAt: -1 })
    .lean();
  if (existing) {
    return {
      exchange: serializeExchange(existing, initiatorId),
      warnings: existing.contextualWarnings ?? [],
      created: false
    };
  }

  const relevance = calculateRelevanceScore(initiator, target);
  const capability = calculateCapabilityScore(initiator, target);
  const targetCapability = calculateCapabilityScore(target, initiator);
  const reciprocity = evaluateReciprocity(initiator, target);
  const contextualWarnings = buildContextualWarnings({ sourceUser: initiator, targetUser: target, relevance, capability, reciprocity });

  const exchange = await Exchange.create({
    participants: [
      { userId: initiatorId, approvedProfessionalUnlock: true, approvedSensitiveUnlock: false },
      { userId: targetUserId, approvedProfessionalUnlock: false, approvedSensitiveUnlock: false }
    ],
    exchangeType,
    status: "requested",
    permissionLayer: "compatibility",
    unlockState: { professionalUnlocked: false, sensitiveUnlocked: false },
    relevance,
    capability,
    reciprocity,
    contextualWarnings: [
      ...contextualWarnings,
      ...(targetCapability.score < 40
        ? ["Partner currently has limited capability. You may receive lower reciprocal value."]
        : [])
    ],
    trustSnapshot: {
      initiatorTier: initiator.trustTier ?? "unverified",
      targetTier: target.trustTier ?? "unverified",
      initiatorReputation: initiator.exchangeReputation ?? "neutral",
      targetReputation: target.exchangeReputation ?? "neutral"
    },
    lifecycleLog: [{ action: "exchange_requested", actorId: initiatorId, metadata: { exchangeType } }]
  });

  const { conversation } = await createConversationIfNotExists(initiatorId, targetUserId);
  const exchangeLabel = exchangeType === "role_experience" ? "Role Experience" : "Interview Experience";
  await postSystemMessage(conversation.id, initiatorId, `Requested a ${exchangeLabel} exchange.`, {
    kind: "exchange_requested_notification",
    exchangeType
  });

  await User.updateOne({ _id: initiatorId }, { $inc: { "exchangeStats.requestsSent": 1 } });
  for (const participant of exchange.participants) {
    emitToUser(String(participant.userId), "exchange_updated", {
      exchangeId: String(exchange._id),
      action: "exchange_requested"
    });
  }

  return {
    exchange: serializeExchange(exchange.toObject(), initiatorId),
    warnings: contextualWarnings,
    created: true
  };
}

export async function acceptExchangeRequest(userId, exchangeId) {
  const actorId = toObjectId(userId);
  const normalizedExchangeId = toObjectId(exchangeId, "Invalid exchange id.");
  const exchange = await getExchangeWithAccessOrFail(normalizedExchangeId, actorId);

  const actor = await User.findById(actorId).lean();
  if (exchange.exchangeType === "role_experience" && !hasRoleTemplate(actor.exchangeProfile)) {
    throw new AppError("Please save your Role Experience template first.", 400);
  }
  if (exchange.exchangeType === "interview_experience" && !hasInterviewTemplate(actor.exchangeProfile)) {
    throw new AppError("Please save your Interview Experience template first.", 400);
  }

  // Idempotency:
  // - If already active, just return current state.
  // - If requester already accepted, return current state (even if still waiting on partner).
  if (exchange.status === "active") {
    return serializeExchange(exchange, actorId);
  }
  const actorParticipant = exchange.participants.find((participant) => String(participant.userId) === String(actorId));
  if (exchange.status === "requested" && actorParticipant?.approvedProfessionalUnlock) {
    return serializeExchange(exchange, actorId);
  }
  if (exchange.status !== "requested") {
    throw new AppError("Exchange request is no longer pending.", 409);
  }

  const participants = exchange.participants.map((participant) => ({
    ...participant,
    approvedProfessionalUnlock:
      String(participant.userId) === String(actorId) ? true : participant.approvedProfessionalUnlock
  }));

  const allApproved = participants.every((participant) => participant.approvedProfessionalUnlock);

  const updated = await Exchange.findByIdAndUpdate(
    normalizedExchangeId,
    {
      $set: {
        participants,
        status: allApproved ? "active" : "requested",
        permissionLayer: allApproved ? "professional" : "compatibility",
        unlockState: {
          professionalUnlocked: allApproved,
          sensitiveUnlocked: exchange.unlockState?.sensitiveUnlocked ?? false
        }
      },
      $push: {
        lifecycleLog: {
          action: "exchange_accepted",
          actorId,
          metadata: { professionalUnlocked: allApproved }
        }
      }
    },
    { new: true }
  ).lean();

  await User.updateOne({ _id: actorId }, { $inc: { "exchangeStats.requestsAccepted": 1 } });

  // Track accepted commitment for reliability
  incrementAcceptedCommitments(actorId).catch(() => {});
  for (const participant of participants) {
    emitToUser(String(participant.userId), "exchange_updated", {
      exchangeId: String(updated._id),
      action: "exchange_accepted",
      permissionLayer: updated.permissionLayer
    });
  }

  if (allApproved) {
    const leftId = participants[0].userId;
    const rightId = participants[1].userId;
    const partnerId = String(leftId) === String(actorId) ? rightId : leftId;
    const [{ conversation }, leftUser, rightUser] = await Promise.all([
      createConversationIfNotExists(actorId, partnerId),
      User.findById(leftId).select("_id email exchangeProfile role experience").lean(),
      User.findById(rightId).select("_id email exchangeProfile role experience").lean()
    ]);

    const exchangeLabel = updated.exchangeType === "role_experience" ? "Role Experience" : "Interview Experience";
    await postSystemMessage(conversation.id, actorId, `${exchangeLabel} exchange accepted — templates have been shared.`, {
      kind: "exchange_accepted_notification",
      exchangeType: updated.exchangeType
    });

    const templateKind = updated.exchangeType === "role_experience" ? "role" : "interview";
    const leftTemplate =
      templateKind === "role" ? leftUser?.exchangeProfile?.roleTemplate ?? null : leftUser?.exchangeProfile?.interviewTemplate ?? null;
    const rightTemplate =
      templateKind === "role"
        ? rightUser?.exchangeProfile?.roleTemplate ?? null
        : rightUser?.exchangeProfile?.interviewTemplate ?? null;

    await postSystemMessage(conversation.id, leftId, "Shared a template for this exchange.", {
      kind: "exchange_template",
      templateKind,
      template: leftTemplate
    });
    await postSystemMessage(conversation.id, rightId, "Shared a template for this exchange.", {
      kind: "exchange_template",
      templateKind,
      template: rightTemplate
    });
  }

  return serializeExchange(updated, actorId);
}

export async function approveSensitiveUnlock(userId, exchangeId) {
  const actorId = toObjectId(userId);
  const normalizedExchangeId = toObjectId(exchangeId, "Invalid exchange id.");
  const exchange = await getExchangeWithAccessOrFail(normalizedExchangeId, actorId);

  if (!exchange.unlockState?.professionalUnlocked) {
    throw new AppError("Professional layer must be unlocked first.", 400);
  }

  // ── Relevance gate: sensitive exchange only for closely-matched users ──
  const relevanceScore = exchange.relevance?.score ?? 0;
  if (relevanceScore < 50) {
    throw new AppError(
      "Sensitive information exchange is only available for closely matched users (50%+ role compatibility). Your profiles are not compatible enough for this.",
      403
    );
  }

  const [leftUser, rightUser] = await Promise.all([
    User.findById(exchange.participants[0].userId).lean(),
    User.findById(exchange.participants[1].userId).lean()
  ]);
  const leftVerification = evaluateExchangeProfileVerification(leftUser);
  const rightVerification = evaluateExchangeProfileVerification(rightUser);
  const leftCap = calculateCapabilityScore(leftUser, rightUser);
  const rightCap = calculateCapabilityScore(rightUser, leftUser);
  const frictionWarnings = [];
  if (leftVerification.status !== "verified" || rightVerification.status !== "verified") {
    frictionWarnings.push(
      "Sensitive layer: verification is still building for one or both users. Only share what you are comfortable with."
    );
  }
  if (leftCap.score < 40 || rightCap.score < 40) {
    frictionWarnings.push(
      "Capability signals suggest uneven exchange value. Sensitive details are optional—use normal chat only if you both agree."
    );
  }

  if (exchange.unlockState?.sensitiveUnlocked) {
    return {
      exchange: serializeExchange(exchange, actorId),
      warning: "Sensitive layer is already unlocked.",
      frictionWarnings: []
    };
  }

  const currentActorParticipant = exchange.participants.find((p) => String(p.userId) === String(actorId));
  if (currentActorParticipant?.approvedSensitiveUnlock) {
    return {
      exchange: serializeExchange(exchange, actorId),
      warning: "Waiting for your partner to approve sensitive unlock.",
      frictionWarnings
    };
  }

  const participants = exchange.participants.map((participant) => ({
    ...participant,
    approvedSensitiveUnlock:
      String(participant.userId) === String(actorId) ? true : participant.approvedSensitiveUnlock
  }));

  const hasDualApproval = participants.every((participant) => participant.approvedSensitiveUnlock);

  const updated = await Exchange.findByIdAndUpdate(
    normalizedExchangeId,
    {
      $set: {
        participants,
        permissionLayer: hasDualApproval ? "sensitive" : "professional",
        "unlockState.sensitiveUnlocked": hasDualApproval
      },
      $push: {
        lifecycleLog: {
          action: "sensitive_unlock_approved",
          actorId,
          metadata: {
            dualApprovalComplete: hasDualApproval,
            warning: "Sensitive information should be shared only when necessary."
          }
        }
      }
    },
    { new: true }
  ).lean();

  // ── Post chat notifications ──
  const partnerId = exchange.participants.find((p) => String(p.userId) !== String(actorId))?.userId;
  if (partnerId) {
    const { conversation } = await createConversationIfNotExists(actorId, partnerId);
    if (!hasDualApproval) {
      // First user requested — notify both
      await postSystemMessage(
        conversation.id,
        actorId,
        "Requested a sensitive information exchange. Both users must agree before any info is shared.",
        { kind: "sensitive_unlock_requested" }
      );
    } else {
      // Both agreed — notify both and prompt to submit info
      await postSystemMessage(
        conversation.id,
        actorId,
        "Both users agreed to share sensitive info. You can now submit your sensitive details — both will be revealed simultaneously when both have submitted.",
        { kind: "sensitive_unlock_approved" }
      );
    }
  }

  if (hasDualApproval) {
    await User.updateOne({ _id: actorId }, { $inc: { "exchangeStats.sensitiveUnlockApproved": 1 } });
  }
  for (const participant of participants) {
    emitToUser(String(participant.userId), "exchange_updated", {
      exchangeId: String(updated._id),
      action: "sensitive_unlock_updated",
      permissionLayer: updated.permissionLayer
    });
  }

  return {
    exchange: serializeExchange(updated, actorId),
    warning:
      frictionWarnings.length > 0
        ? `${frictionWarnings.join(" ")} After dual approval, continue with caution.`
        : "Sensitive sharing preference recorded. Dual approval is required before sensitive entries unlock.",
    frictionWarnings
  };
}

export async function addExchangeEntry(userId, payload) {
  const actorId = toObjectId(userId);
  const exchangeId = toObjectId(payload?.exchangeId, "Invalid exchange id.");
  const exchange = await getExchangeWithAccessOrFail(exchangeId, actorId);

  if (exchange.status !== "active") {
    throw new AppError("Exchange is not active.", 409);
  }

  const entryType = String(payload?.entryType ?? "").trim();
  if (!["role", "interview", "sensitive"].includes(entryType)) {
    throw new AppError("Invalid exchange entry type.", 400);
  }

  const expectedType = getExpectedEntryType(exchange.exchangeType);
  if (entryType !== "sensitive" && expectedType && entryType !== expectedType) {
    throw new AppError(`This exchange only supports sharing "${expectedType}" entries.`, 400);
  }

  const content = String(payload?.content ?? "").trim();
  if (!content) {
    throw new AppError("Exchange content is required.", 400);
  }

  const visibilityLayer = entryType === "sensitive" ? "sensitive" : "professional";

  if (visibilityLayer === "professional" && !exchange.unlockState?.professionalUnlocked) {
    throw new AppError("Professional exchange layer is not unlocked yet.", 403);
  }

  if (visibilityLayer === "sensitive" && !exchange.unlockState?.sensitiveUnlocked) {
    throw new AppError("Sensitive exchange requires dual approval.", 403);
  }

  const entry = await ExchangeEntry.create({
    exchangeId,
    authorId: actorId,
    entryType,
    visibilityLayer,
    content,
    metadata: payload?.metadata ?? {}
  });

  await Promise.all([
    User.updateOne({ _id: actorId }, { $inc: { "exchangeStats.entriesShared": 1 } }),
    Exchange.updateOne(
      { _id: exchangeId },
      {
        $push: {
          lifecycleLog: {
            action: "exchange_entry_shared",
            actorId,
            metadata: { entryType, visibilityLayer }
          }
        }
      }
    )
  ]);
  for (const participant of exchange.participants) {
    emitToUser(String(participant.userId), "exchange_updated", {
      exchangeId: String(exchangeId),
      action: "exchange_entry_shared"
    });
  }

  return serializeEntry(entry.toObject());
}

export async function listExchangeEntries(userId, exchangeId, page = 1, limit = 20) {
  const actorId = toObjectId(userId);
  const normalizedExchangeId = toObjectId(exchangeId, "Invalid exchange id.");
  const exchange = await getExchangeWithAccessOrFail(normalizedExchangeId, actorId);

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 20));

  const visibilityFilter = exchange.unlockState?.sensitiveUnlocked
    ? {}
    : { visibilityLayer: "professional" };

  const query = { exchangeId: normalizedExchangeId, ...visibilityFilter };
  const [entries, total] = await Promise.all([
    ExchangeEntry.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ExchangeEntry.countDocuments(query)
  ]);

  return {
    entries: entries.reverse().map(serializeEntry),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      hasNextPage: pageNumber * pageSize < total
    }
  };
}

export async function listMyExchanges(userId) {
  const actorId = toObjectId(userId);
  const exchanges = await Exchange.find({ "participants.userId": actorId })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return exchanges.map((exchange) => serializeExchange(exchange, actorId));
}

export async function upsertExchangeProfile(userId, payload) {
  const actorId = toObjectId(userId);
  const lastJobExperience = String(payload?.lastJobExperience ?? "").trim();
  const lastInterviewExperience = String(payload?.lastInterviewExperience ?? "").trim();
  const roleTransitionNotes = String(payload?.roleTransitionNotes ?? "").trim();

  const roleTemplatePayload = payload?.roleTemplate ?? null;
  const interviewTemplatePayload = payload?.interviewTemplate ?? null;

  const current = await User.findById(actorId).select("exchangeProfile").lean();
  const roleTemplate = roleTemplatePayload ? normalizeRoleTemplatePayload(roleTemplatePayload) : null;
  const interviewTemplate = interviewTemplatePayload ? normalizeInterviewTemplatePayload(interviewTemplatePayload) : null;

  const mergedProfile = {
    lastJobExperience: lastJobExperience || current?.exchangeProfile?.lastJobExperience || null,
    lastInterviewExperience: lastInterviewExperience || current?.exchangeProfile?.lastInterviewExperience || null,
    roleTransitionNotes: roleTransitionNotes || current?.exchangeProfile?.roleTransitionNotes || null,
    roleTemplate: roleTemplate ?? current?.exchangeProfile?.roleTemplate ?? {},
    interviewTemplate: interviewTemplate ?? current?.exchangeProfile?.interviewTemplate ?? {}
  };

  const hasAnyTemplate = Boolean(
    hasRoleTemplate({ roleTemplate: mergedProfile.roleTemplate }) ||
      hasInterviewTemplate({ interviewTemplate: mergedProfile.interviewTemplate })
  );
  if (!hasAnyTemplate && (!mergedProfile.lastJobExperience || !mergedProfile.lastInterviewExperience)) {
    throw new AppError("Please provide templates (recommended) or lastJobExperience + lastInterviewExperience.", 400);
  }

  const updated = await User.findByIdAndUpdate(
    actorId,
    {
      $set: {
        "exchangeProfile.lastJobExperience": mergedProfile.lastJobExperience,
        "exchangeProfile.lastInterviewExperience": mergedProfile.lastInterviewExperience,
        "exchangeProfile.roleTransitionNotes": mergedProfile.roleTransitionNotes,
        ...(roleTemplate ? { "exchangeProfile.roleTemplate": roleTemplate } : {}),
        ...(interviewTemplate ? { "exchangeProfile.interviewTemplate": interviewTemplate } : {}),
        "exchangeProfile.verificationStatus": "pending",
        "exchangeProfile.verificationSource": "community_consistency",
        "exchangeProfile.submittedAt": new Date(),
        "exchangeProfile.reviewedAt": null
      }
    },
    { new: true }
  )
    .select("_id exchangeProfile trustTier exchangeReputation")
    .lean();

  return {
    profile: {
      lastJobExperience: updated.exchangeProfile?.lastJobExperience ?? null,
      lastInterviewExperience: updated.exchangeProfile?.lastInterviewExperience ?? null,
      roleTransitionNotes: updated.exchangeProfile?.roleTransitionNotes ?? null,
      roleTemplate: updated.exchangeProfile?.roleTemplate ?? null,
      interviewTemplate: updated.exchangeProfile?.interviewTemplate ?? null,
      verificationStatus: updated.exchangeProfile?.verificationStatus ?? "not_submitted",
      verificationSource: updated.exchangeProfile?.verificationSource ?? "community_consistency",
      submittedAt: updated.exchangeProfile?.submittedAt ?? null,
      reviewedAt: updated.exchangeProfile?.reviewedAt ?? null
    }
  };
}

export async function getExchangeProfile(userId) {
  const actorId = toObjectId(userId);
  const user = await User.findById(actorId)
    .select("_id exchangeProfile trustTier exchangeReputation")
    .lean();
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return {
    profile: {
      lastJobExperience: user.exchangeProfile?.lastJobExperience ?? null,
      lastInterviewExperience: user.exchangeProfile?.lastInterviewExperience ?? null,
      roleTransitionNotes: user.exchangeProfile?.roleTransitionNotes ?? null,
      roleTemplate: user.exchangeProfile?.roleTemplate ?? null,
      interviewTemplate: user.exchangeProfile?.interviewTemplate ?? null,
      verificationStatus: user.exchangeProfile?.verificationStatus ?? "not_submitted",
      verificationSource: user.exchangeProfile?.verificationSource ?? "community_consistency",
      submittedAt: user.exchangeProfile?.submittedAt ?? null,
      reviewedAt: user.exchangeProfile?.reviewedAt ?? null
    }
  };
}

export async function reportExchange(userId, payload) {
  const actorId = toObjectId(userId);
  const exchangeId = toObjectId(payload?.exchangeId, "Invalid exchange id.");
  const reason = String(payload?.reason ?? "").trim();

  if (!reason) {
    throw new AppError("Report reason is required.", 400);
  }

  const exchange = await getExchangeWithAccessOrFail(exchangeId, actorId);
  const targetParticipant = exchange.participants.find((p) => String(p.userId) !== String(actorId));

  await Promise.all([
    Exchange.updateOne(
      { _id: exchangeId },
      {
        $set: { status: "reported" },
        $push: {
          lifecycleLog: {
            action: "exchange_reported",
            actorId,
            metadata: { reason }
          }
        }
      }
    ),
    User.updateOne(
      { _id: targetParticipant?.userId },
      {
        $inc: {
          reportCount: 1,
          abuseIncidentCount: 1,
          "exchangeStats.reportedByPeers": 1
        }
      }
    )
  ]);

  if (targetParticipant?.userId) {
    await refreshUserTrust(targetParticipant.userId);
    emitToUser(String(targetParticipant.userId), "exchange_trust_updated", {
      reason: "report_penalty_applied"
    });
  }

  return { reported: true };
}

export async function completeExchange(userId, exchangeId) {
  const actorId = toObjectId(userId);
  const normalizedExchangeId = toObjectId(exchangeId, "Invalid exchange id.");
  const existing = await getExchangeWithAccessOrFail(normalizedExchangeId, actorId);

  if (existing.status === "completed") {
    return serializeExchange(existing, actorId);
  }

  if (existing.status !== "active") {
    throw new AppError("Only an active exchange can be marked complete.", 409);
  }

  const updated = await Exchange.findOneAndUpdate(
    { _id: normalizedExchangeId, status: "active" },
    {
      $set: { status: "completed" },
      $push: {
        lifecycleLog: {
          action: "exchange_completed",
          actorId,
          metadata: {}
        }
      }
    },
    { new: true }
  ).lean();

  if (!updated) {
    const latest = await Exchange.findById(normalizedExchangeId).lean();
    if (latest?.status === "completed") {
      return serializeExchange(latest, actorId);
    }
    throw new AppError("Only an active exchange can be marked complete.", 409);
  }

  const participantIds = updated.participants.map((participant) => participant.userId);
  await User.updateMany(
    { _id: { $in: participantIds } },
    {
      $inc: {
        successfulExchangeCount: 1,
        "exchangeStats.completedExchanges": 1
      }
    }
  );

  // Track contribution for interview_experience exchanges
  if (updated.exchangeType === "interview_experience") {
    incrementContributionForAll(participantIds.map(String), "exchange").catch(() => {});
  }
  // Track completed commitments for reliability
  for (const id of participantIds) {
    incrementCompletedCommitments(String(id)).catch(() => {});
  }

  await Promise.all(participantIds.map((id) => refreshUserTrust(id)));
  return serializeExchange(updated, actorId);
}

export async function shareSensitiveInfo(userId, exchangeId, sensitiveTemplate) {
  const actorId = toObjectId(userId);
  const normalizedExchangeId = toObjectId(exchangeId, "Invalid exchange id.");
  const exchange = await getExchangeWithAccessOrFail(normalizedExchangeId, actorId);

  if (!exchange.unlockState?.sensitiveUnlocked) {
    throw new AppError("Sensitive layer must be unlocked by both users before sharing.", 403);
  }

  if (!sensitiveTemplate || typeof sensitiveTemplate !== "object") {
    throw new AppError("Sensitive template data is required.", 400);
  }

  const template = {
    hrContact: trimOrNull(sensitiveTemplate.hrContact),
    recruiterDetails: trimOrNull(sensitiveTemplate.recruiterDetails),
    referralPathway: trimOrNull(sensitiveTemplate.referralPathway),
    internalProcessNotes: trimOrNull(sensitiveTemplate.internalProcessNotes),
    additionalNotes: trimOrNull(sensitiveTemplate.additionalNotes)
  };

  const hasAnyContent = Object.values(template).some((v) => v !== null);
  if (!hasAnyContent) {
    throw new AppError("At least one sensitive field must be filled.", 400);
  }

  const partnerId = exchange.participants.find((p) => String(p.userId) !== String(actorId))?.userId;
  if (!partnerId) {
    throw new AppError("Exchange partner not found.", 404);
  }

  // ── 24hr cooldown: only after a completed mutual reveal ──
  if (exchange.lastSensitiveSharedAt) {
    const msSinceLast = Date.now() - new Date(exchange.lastSensitiveSharedAt).getTime();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (msSinceLast < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - msSinceLast) / (60 * 60 * 1000));
      throw new AppError(
        `Sensitive info was already exchanged recently. You can share again in ${remainingHours} hour${remainingHours === 1 ? "" : "s"}.`,
        429
      );
    }
  }

  // Store actor's pending template keyed by userId string
  const pendingKey = String(actorId);
  const partnerKey = String(partnerId);
  const currentPending = exchange.pendingSensitiveTemplates ?? {};

  // If actor already submitted, idempotently return waiting state
  if (currentPending[pendingKey]) {
    const partnerSubmitted = Boolean(currentPending[partnerKey]);
    return {
      shared: false,
      waiting: !partnerSubmitted,
      message: partnerSubmitted
        ? "Both submitted — templates will now be revealed."
        : "Your info is saved. Waiting for your partner to submit their details."
    };
  }

  // Save actor's pending template
  const updatedPending = { ...currentPending, [pendingKey]: template };
  const partnerTemplate = updatedPending[partnerKey] ?? null;
  const bothSubmitted = Boolean(partnerTemplate);

  await Exchange.updateOne(
    { _id: normalizedExchangeId },
    {
      $set: { pendingSensitiveTemplates: updatedPending },
      $push: {
        lifecycleLog: {
          action: "sensitive_info_submitted",
          actorId,
          metadata: { fieldsShared: Object.keys(template).filter((k) => template[k] !== null), bothSubmitted }
        }
      }
    }
  );

  const { conversation } = await createConversationIfNotExists(actorId, partnerId);

  if (!bothSubmitted) {
    await postSystemMessage(
      conversation.id,
      actorId,
      "Submitted sensitive info. Waiting for your partner to submit their details before both are revealed.",
      { kind: "sensitive_info_submitted_waiting" }
    );

    for (const participant of exchange.participants) {
      emitToUser(String(participant.userId), "exchange_updated", {
        exchangeId: String(normalizedExchangeId),
        action: "sensitive_info_submitted"
      });
    }

    return {
      shared: false,
      waiting: true,
      message: "Your sensitive info has been saved. As soon as your partner submits theirs, both will be revealed in chat simultaneously."
    };
  }

  // Both submitted — post both templates to chat simultaneously
  await postSystemMessage(conversation.id, actorId, "Shared sensitive information for this exchange.", {
    kind: "exchange_sensitive_template",
    template
  });
  await postSystemMessage(conversation.id, partnerId, "Shared sensitive information for this exchange.", {
    kind: "exchange_sensitive_template",
    template: partnerTemplate
  });

  // Post a single confirmation message visible to both
  await postSystemMessage(
    conversation.id,
    actorId,
    "Both users have shared their sensitive information successfully. Details are now visible above for both sides.",
    { kind: "sensitive_exchange_complete" }
  );

  // Clear pending, set cooldown timestamp
  await Exchange.updateOne(
    { _id: normalizedExchangeId },
    {
      $set: { pendingSensitiveTemplates: {}, lastSensitiveSharedAt: new Date() },
      $push: {
        lifecycleLog: {
          action: "sensitive_info_shared",
          actorId,
          metadata: { mutualReveal: true }
        }
      }
    }
  );

  await User.updateMany(
    { _id: { $in: [actorId, partnerId] } },
    { $inc: { "exchangeStats.entriesShared": 1 } }
  );

  // Track contribution for mutual sensitive exchange reveal
  incrementContributionForAll([String(actorId), String(partnerId)], "sensitive_exchange").catch(() => {});

  for (const participant of exchange.participants) {
    emitToUser(String(participant.userId), "exchange_updated", {
      exchangeId: String(normalizedExchangeId),
      action: "sensitive_info_shared"
    });
  }

  return { shared: true, waiting: false, message: "Both sensitive templates revealed in chat simultaneously." };
}
