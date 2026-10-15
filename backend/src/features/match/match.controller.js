import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { findBestMatchForUser, rematchUser, sendPromotionRequest, acceptPromotionRequest } from "./match.service.js";

export const findMatch = asyncHandler(async (req, res) => {
  const result = await findBestMatchForUser(req.user._id);

  sendSuccess(res, "Match result fetched successfully.", result);
});

export const rematch = asyncHandler(async (req, res) => {
  const result = await rematchUser(req.user._id);

  sendSuccess(res, "Rematch completed successfully.", result);
});

export const promote = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;

  const result = await sendPromotionRequest(req.user._id, targetUserId);

  sendSuccess(res, "Promotion request sent successfully.", { request: result }, 201);
});

export const acceptPromotion = asyncHandler(async (req, res) => {
  const { fromUserId } = req.body;

  const result = await acceptPromotionRequest(req.user._id, fromUserId);

  sendSuccess(res, "Promotion accepted. Match created successfully.", result);
});
