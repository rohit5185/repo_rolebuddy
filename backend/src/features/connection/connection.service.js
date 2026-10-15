import mongoose from "mongoose";

import { AppError } from "../../utils/appError.js";
import { User } from "../auth/auth.model.js";
import { createConversationIfNotExists } from "../chat/chat.service.js";
import { getUserRelationState } from "./visibility.service.js";
import { getMatchCandidates } from "../match/match.engine.js";
import { trackActiveDay } from "../activity/activity.service.js";
import { notifyConnectionRequestReceived, notifyConnectionRequestAccepted } from "../notification/notification.service.js";

const MAX_QUERY_LENGTH = 80;
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9+.#\-/&(),\s]+$/;
const DISCOVERY_PROJECTION =
	"_id displayName role specialization domainArea experience dailyGoal availability status lastActiveAt createdAt matchedUserId activeMatchExpiresAt lastMatchAt connections connectionRequests onboardingCompleted";

function normalizeId(value) {
	return value ? String(value) : "";
}

function isValidObjectId(value) {
	return mongoose.Types.ObjectId.isValid(value);
}

function hasConnection(user, targetUserId) {
	const normalizedTarget = normalizeId(targetUserId);
	return (user.connections ?? []).some((connection) => normalizeId(connection.userId) === normalizedTarget);
}

function normalizeSearchInput(rawQuery) {
	const query = String(rawQuery ?? "").trim();

	if (!query) {
		throw new AppError("Search query required", 400);
	}

	if (query.length > MAX_QUERY_LENGTH) {
		throw new AppError("Search query is too long", 400);
	}

	if (!SAFE_TEXT_REGEX.test(query)) {
		throw new AppError("Search query contains invalid characters", 400);
	}

	return query;
}

function sanitizeLimit(rawLimit, fallback) {
	const parsed = Number(rawLimit);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallback;
	}

	return Math.min(100, Math.floor(parsed));
}

function toPublicDiscoveryProfile(candidate, relation) {
	return {
		_id: candidate._id,
		displayName: candidate.displayName ?? null,
		role: candidate.role ?? null,
		specialization: candidate.specialization ?? null,
		domainArea: candidate.domainArea ?? null,
		experience: candidate.experience ?? null,
		dailyGoal: candidate.dailyGoal ?? null,
		availability: candidate.availability ?? null,
		status: candidate.status ?? "waiting",
		lastActiveAt: candidate.lastActiveAt ?? null,
		matchScore: relation.matchScore,
		relation: relation.state
	};
}

async function getViewerAndCandidateForRelation(viewerId, targetId) {
	const [viewer, target] = await Promise.all([
		User.findById(viewerId)
			.select("_id matchedUserId activeMatchExpiresAt lastMatchAt connections connectionRequests onboardingCompleted")
			.lean(),
		User.findById(targetId)
			.select("_id matchedUserId activeMatchExpiresAt lastMatchAt connections connectionRequests onboardingCompleted")
			.lean()
	]);

	return { viewer, target };
}

async function getAvailableProfiles(userId, options = {}) {
	const user = await User.findById(userId)
		.select("_id domain role specialization domainArea experience matchedUserId activeMatchExpiresAt lastMatchAt connections connectionRequests onboardingCompleted")
		.lean();

	if (!user) {
		throw new AppError("User not found", 404);
	}

	if (!user.onboardingCompleted) {
		throw new AppError("Complete onboarding first", 400);
	}

	const limit = sanitizeLimit(options.limit, 10);
	const query = options.query ? normalizeSearchInput(options.query) : null;

	const additionalFilter = query
		? {
				$or: [
					{ role: { $regex: query, $options: "i" } },
					{ specialization: { $regex: query, $options: "i" } },
					{ domainArea: { $regex: query, $options: "i" } },
					{ displayName: { $regex: query, $options: "i" } }
				]
			}
		: {};

	const rawCandidates = await getMatchCandidates(user, {
		additionalFilter,
		limit: Math.max(limit * 8, 120),
		projection: DISCOVERY_PROJECTION
	});

	const filtered = rawCandidates
		.map((candidate) => {
			const relation = getUserRelationState(user, candidate);

			if (relation.state !== "available") {
				return null;
			}

			return toPublicDiscoveryProfile(candidate, relation);
		})
		.filter(Boolean)
		.sort((left, right) => {
			if (right.matchScore !== left.matchScore) {
				return right.matchScore - left.matchScore;
			}

			const leftActive = left.lastActiveAt ? new Date(left.lastActiveAt).getTime() : 0;
			const rightActive = right.lastActiveAt ? new Date(right.lastActiveAt).getTime() : 0;
			return rightActive - leftActive;
		});

	return filtered.slice(0, limit);
}

async function buildUniqueDisplayName(baseWord, userId) {
	const normalizedBaseWord = baseWord?.trim() || "User";
	let randomNum = Math.floor(Math.random() * 90) + 10;
	let candidate = `${normalizedBaseWord}${randomNum}`;
	let counter = 1;

	while (await User.exists({ displayName: candidate, _id: { $ne: userId } })) {
		candidate = `${normalizedBaseWord}${randomNum}v${counter}`;
		counter += 1;
	}

	return candidate;
}

export async function generateDisplayName(userId) {
	const user = await User.findById(userId).select("displayName specialization role");

	if (!user) {
		throw new AppError("User not found", 404);
	}

	if (user.displayName) {
		return user;
	}

	const baseWord = user.specialization || user.role || "User";

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const displayName = await buildUniqueDisplayName(baseWord, userId);

		try {
			const updatedUser = await User.findOneAndUpdate(
				{
					_id: userId,
					$or: [{ displayName: { $exists: false } }, { displayName: null }, { displayName: "" }]
				},
				{ $set: { displayName } },
				{ new: true }
			);

			if (!updatedUser) {
				const currentUser = await User.findById(userId).select("displayName role specialization");
				if (currentUser?.displayName) {
					return currentUser;
				}
				continue;
			}

			return updatedUser;
		} catch (error) {
			if (error?.code === 11000) {
				continue;
			}
			throw error;
		}
	}

	throw new AppError("Could not generate display name. Please try again.", 500);
}

export async function getUserPublicProfile(userId) {
	const user = await User.findById(userId).select(
		"displayName role specialization domainArea experience dailyGoal availability lastActiveAt reliabilityLabel contributionCount totalAcceptedCommitments"
	).lean();

	if (!user) {
		throw new AppError("User not found", 404);
	}

	const now = new Date();
	const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const activeToday = user.lastActiveAt ? new Date(user.lastActiveAt) >= todayStart : false;

	return {
		_id: user._id,
		displayName: user.displayName ?? null,
		role: user.role ?? null,
		specialization: user.specialization ?? null,
		domainArea: user.domainArea ?? null,
		experience: user.experience ?? null,
		dailyGoal: user.dailyGoal ?? null,
		availability: user.availability ?? null,
		lastActiveAt: user.lastActiveAt ?? null,
		activeToday,
		contributionCount: Number(user.contributionCount ?? 0),
		reliabilityLabel: (user.totalAcceptedCommitments ?? 0) >= 3 ? (user.reliabilityLabel ?? null) : null
	};
}

export async function sendConnectionRequest(fromUserId, toUserId) {
	if (!isValidObjectId(toUserId)) {
		throw new AppError("Invalid user ID", 400);
	}

	if (normalizeId(fromUserId) === normalizeId(toUserId)) {
		throw new AppError("Cannot send connection request to yourself", 400);
	}

	const { viewer: fromUser, target: toUser } = await getViewerAndCandidateForRelation(fromUserId, toUserId);

	if (!fromUser) {
		throw new AppError("Current user not found", 404);
	}

	if (!toUser) {
		throw new AppError("Target user not found", 404);
	}

	if (hasConnection(fromUser, toUserId) || hasConnection(toUser, fromUserId)) {
		throw new AppError("Already connected with this user", 400);
	}

	const relation = getUserRelationState(fromUser, toUser);
	if (relation.state === "pending_sent") {
		return {
			message: "Connection request sent successfully",
			request: {
				from: fromUserId,
				to: toUserId,
				status: "pending"
			},
			created: false
		};
	}

	if (relation.state === "pending_received") {
		throw new AppError("This user has already sent you a pending request.", 409);
	}

	if (relation.state === "matched") {
		throw new AppError("You are already matched with this user", 400);
	}

	// Track active day for consistency streak
	trackActiveDay(fromUserId).catch(() => {});

	const updateResult = await User.updateOne(
		{
			_id: toUser._id,
			connectionRequests: {
				$not: {
					$elemMatch: {
						from: new mongoose.Types.ObjectId(fromUserId),
						to: new mongoose.Types.ObjectId(toUserId),
						status: "pending"
					}
				}
			}
		},
		{
			$push: {
				connectionRequests: {
					from: fromUserId,
					to: toUserId,
					status: "pending",
					createdAt: new Date()
				}
			}
		}
	);

	return {
		message: "Connection request sent successfully",
		request: {
			from: fromUserId,
			to: toUserId,
			status: "pending"
		},
		created: updateResult.modifiedCount === 1
	};

	// Notify recipient (fire-and-forget)
	notifyConnectionRequestReceived(toUserId, fromUser.displayName ?? "Someone").catch(() => {});
}

export async function acceptConnectionRequest(userId, fromUserId) {
	if (!isValidObjectId(fromUserId)) {
		throw new AppError("Invalid user ID", 400);
	}

	const [user, requester] = await Promise.all([User.findById(userId), User.findById(fromUserId)]);

	if (!user) {
		throw new AppError("Current user not found", 404);
	}

	if (!requester) {
		throw new AppError("Requester not found", 404);
	}

	let touchedPending = false;
	for (const request of user.connectionRequests ?? []) {
		if (
			request.status === "pending" &&
			normalizeId(request.from) === normalizeId(fromUserId) &&
			normalizeId(request.to) === normalizeId(userId)
		) {
			request.status = "accepted";
			touchedPending = true;
		}
	}

	// Clean up edge-case stale mirrored entries if they exist.
	for (const request of requester.connectionRequests ?? []) {
		if (
			request.status === "pending" &&
			normalizeId(request.from) === normalizeId(fromUserId) &&
			normalizeId(request.to) === normalizeId(userId)
		) {
			request.status = "accepted";
			touchedPending = true;
		}
	}

	if (!touchedPending) {
		throw new AppError("Connection request not found", 404);
	}

	if (!hasConnection(user, fromUserId)) {
		user.connections.push({ userId: fromUserId });
	}

	if (!hasConnection(requester, userId)) {
		requester.connections.push({ userId });
	}

	await Promise.all([user.save(), requester.save()]);

	// Track active day for consistency streak (for accepting user)
	trackActiveDay(userId).catch(() => {});

	// Notify the person who sent the request (fire-and-forget)
	notifyConnectionRequestAccepted(fromUserId, user.displayName ?? "Someone").catch(() => {});

	const conversationResult = await createConversationIfNotExists(userId, fromUserId);

	return {
		message: "Connection request accepted",
		connection: {
			userId: fromUserId,
			displayName: requester.displayName,
			role: requester.role
		},
		conversationId: conversationResult.conversation.id
	};
}

export async function rejectConnectionRequest(userId, fromUserId) {
	const [user, requester] = await Promise.all([User.findById(userId), User.findById(fromUserId)]);

	if (!user) {
		throw new AppError("Current user not found", 404);
	}

	let rejectedAny = false;

	for (const request of user.connectionRequests ?? []) {
		if (
			request.status === "pending" &&
			normalizeId(request.from) === normalizeId(fromUserId) &&
			normalizeId(request.to) === normalizeId(userId)
		) {
			request.status = "rejected";
			rejectedAny = true;
		}
	}

	if (requester) {
		for (const request of requester.connectionRequests ?? []) {
			if (
				request.status === "pending" &&
				normalizeId(request.from) === normalizeId(fromUserId) &&
				normalizeId(request.to) === normalizeId(userId)
			) {
				request.status = "rejected";
				rejectedAny = true;
			}
		}
	}

	if (!rejectedAny) {
		throw new AppError("Connection request not found", 404);
	}

	await Promise.all([user.save(), requester ? requester.save() : Promise.resolve()]);

	return {
		message: "Connection request rejected"
	};
}

export async function getPendingConnectionRequests(userId) {
	const user = await User.findById(userId).populate({
		path: "connectionRequests.from",
		select: "displayName role specialization experience domainArea"
	});

	if (!user) {
		throw new AppError("User not found", 404);
	}

	const pendingRequests = (user.connectionRequests ?? []).filter((request) => request.status === "pending");

	return pendingRequests.map((request) => {
		const requestObject = typeof request.toObject === "function" ? request.toObject() : request;
		const fromObject =
			requestObject?.from && typeof requestObject.from === "object" ? requestObject.from : null;

		return {
			...requestObject,
			from: fromObject
				? {
						...fromObject,
						userId: String(fromObject._id ?? fromObject.userId ?? "")
					}
				: fromObject
		};
	});
}

export async function getUserConnections(userId) {
	const user = await User.findById(userId).populate({
		path: "connections.userId",
		select: "displayName role specialization experience domainArea lastActiveAt"
	});

	if (!user) {
		throw new AppError("User not found", 404);
	}

	return user.connections;
}

export async function getProfileSuggestions(userId, limit = 10) {
	return getAvailableProfiles(userId, { limit });
}

export async function searchProfiles(userId, query, limit = 20) {
	return getAvailableProfiles(userId, { query, limit });
}

