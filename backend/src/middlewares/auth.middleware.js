import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { User } from "../features/auth/auth.model.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function extractToken(req) {
  const cookieToken = req.cookies?.accessToken;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
}

export const verifyJwt = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new AppError("Authentication required.", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError("Invalid or expired token.", 401);
  }

  const user = await User.findById(payload.sub)
    .select(
      "_id email createdAt domain domainArea primaryArea area specialization role experience skills intent goal dailyGoal availabilityFrequency availabilityTime availability preferences status matchedUserId onboardingCompleted"
    )
    .lean();

  if (!user) {
    throw new AppError("User not found.", 401);
  }

  req.user = user;
  next();
});
