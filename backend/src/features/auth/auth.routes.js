import { Router } from "express";
import {
  login,
  logout,
  signup,
  sendOtpHandler,
  verifyOtpHandler,
  googleRedirect,
  googleCallback
} from "./auth.controller.js";

const authRouter = Router();

// Password auth (existing)
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// OTP auth
authRouter.post("/otp/send", sendOtpHandler);
authRouter.post("/otp/verify", verifyOtpHandler);

// Google Sign-In OAuth
authRouter.get("/google", googleRedirect);
authRouter.get("/google/callback", googleCallback);

export default authRouter;
