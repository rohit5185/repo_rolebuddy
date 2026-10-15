import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import {
  generateDisplayName,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingConnectionRequests,
  getUserConnections,
  getProfileSuggestions,
  searchProfiles,
  getUserPublicProfile
} from "./connection.service.js";

/**
 * Generate and set display name for current user
 */
export const setDisplayName = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updatedUser = await generateDisplayName(userId);

  sendSuccess(res, "Display name generated successfully.", {
    displayName: updatedUser.displayName
  });
});

/**
 * Send connection request
 */
export const sendRequest = asyncHandler(async (req, res) => {
  const { toUserId } = req.body;
  const fromUserId = req.user._id;

  const result = await sendConnectionRequest(fromUserId, toUserId);

  sendSuccess(
    res,
    result.message,
    { request: result.request },
    result.created ? 201 : 200
  );
});

/**
 * Accept connection request
 */
export const acceptRequest = asyncHandler(async (req, res) => {
  const { fromUserId } = req.body;
  const userId = req.user._id;

  const result = await acceptConnectionRequest(userId, fromUserId);

  sendSuccess(res, result.message, {
    connection: result.connection,
    conversationId: result.conversationId
  });
});

/**
 * Reject connection request
 */
export const rejectRequest = asyncHandler(async (req, res) => {
  const { fromUserId } = req.body;
  const userId = req.user._id;

  const result = await rejectConnectionRequest(userId, fromUserId);

  sendSuccess(res, result.message);
});

/**
 * Get pending connection requests
 */
export const getRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const requests = await getPendingConnectionRequests(userId);

  res.status(200).json({
    message: "Pending requests fetched successfully",
    data: requests
  });
});

/**
 * Get all connections
 */
export const getConnections = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const connections = await getUserConnections(userId);

  res.status(200).json({
    message: "Connections fetched successfully",
    data: connections
  });
});

/**
 * Get profile suggestions
 */
export const getSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  const suggestions = await getProfileSuggestions(userId, limit);

  res.status(200).json({
    message: "Profile suggestions fetched successfully",
    data: suggestions
  });
});

/**
 * Search profiles
 */
export const search = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 20;

  const results = await searchProfiles(userId, q, limit);

  res.status(200).json({
    message: "Search results fetched successfully",
    data: results
  });
});

/**
 * Get public profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const profile = await getUserPublicProfile(userId);

  res.status(200).json({
    message: "Profile fetched successfully",
    data: profile
  });
});
