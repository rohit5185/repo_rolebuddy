import { Router } from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { getDashboard, getMatchHistoryHandler, getProfile, updateOnboarding } from "./user.controller.js";

const userRouter = Router();

userRouter.get("/dashboard", verifyJwt, getDashboard);
userRouter.get("/profile", verifyJwt, getProfile);
userRouter.get("/match-history", verifyJwt, getMatchHistoryHandler);
userRouter.put("/onboarding", verifyJwt, updateOnboarding);

export default userRouter;
