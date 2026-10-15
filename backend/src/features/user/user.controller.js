import { asyncHandler } from "../../utils/asyncHandler.js";
import { completeOnboarding, getDashboardSnapshot, getMatchHistory } from "./user.service.js";



export const getProfile = asyncHandler(async (req, res) => {
  const { getUserProfile } = await import("./user.service.js");
  const user = await getUserProfile(req.user._id);

  res.status(200).json({
    message: "Profile fetched successfully.",
    data: { user }
  });
});

export const updateOnboarding = asyncHandler(async (req, res) => {
  const user = await completeOnboarding(req.user._id, req.body);

  res.status(200).json({
    message: "Onboarding completed successfully.",
    data: {
      user
    }
  });
});

export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardSnapshot(req.user._id);

  res.status(200).json({
    message: "Dashboard fetched successfully.",
    data: dashboard
  });
});

export const getMatchHistoryHandler = asyncHandler(async (req, res) => {
  const history = await getMatchHistory(req.user._id);

  res.status(200).json({
    message: "Match history fetched.",
    data: history
  });
});
