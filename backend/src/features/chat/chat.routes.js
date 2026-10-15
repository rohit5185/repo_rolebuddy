import { Router } from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { createConversation, listConversations, listMessages, postMessage, seenMessage } from "./chat.controller.js";

const chatRouter = Router();

chatRouter.get("/", (_req, res) => {
  res.status(200).json({ message: "Chat feature is ready.", data: null });
});

chatRouter.get("/conversations", verifyJwt, listConversations);
chatRouter.post("/conversations", verifyJwt, createConversation);
chatRouter.get("/messages/:conversationId", verifyJwt, listMessages);
chatRouter.post("/messages", verifyJwt, postMessage);
chatRouter.post("/messages/:messageId/seen", verifyJwt, seenMessage);

export default chatRouter;
