import express from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import {
  setDisplayName,
  sendRequest,
  acceptRequest,
  rejectRequest,
  getRequests,
  getConnections,
  getSuggestions,
  search,
  getProfile
} from "./connection.controller.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJwt);

// Display name
router.post("/display-name", setDisplayName);

// Connection requests
router.post("/request", sendRequest);
router.post("/request/accept", acceptRequest);
router.post("/request/reject", rejectRequest);
router.get("/requests", getRequests);

// Connections
router.get("/list", getConnections);

// Discovery
router.get("/suggestions", getSuggestions);
router.get("/search", search);

// Public profile
router.get("/profile/:userId", getProfile);

export default router;
