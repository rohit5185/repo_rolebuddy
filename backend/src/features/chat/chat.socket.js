import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { User } from "../auth/auth.model.js";
import {
  acceptExchangeRequest,
  addExchangeEntry,
  approveSensitiveUnlock,
  createExchangeRequest
} from "../exchange/exchange.service.js";
import {
  acceptInterview,
  completeInterview,
  createInterviewRequest,
  declineInterview,
  pauseLiveOnlineInterviewOnDisconnect,
  sendQuestion,
  submitAnswer,
  submitFeedback
} from "../interview/interview.service.js";
import {
  getConversationRoomName,
  getUserRoomName,
  markUserSocketConnected,
  markUserSocketDisconnected,
  setChatIo
} from "./chat.realtime.js";
import { createConversationForMatch, markMessageSeen, sendConversationMessage } from "./chat.service.js";

let redisPubClient;
let redisSubClient;

function extractTokenFromHandshake(socket) {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const authorizationHeader = socket.handshake.headers.authorization;
  if (typeof authorizationHeader === "string" && authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.split(" ")[1];
  }

  const cookieHeader = socket.handshake.headers.cookie;
  if (typeof cookieHeader === "string") {
    const match = cookieHeader.match(/(?:^|; )accessToken=([^;]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

async function authenticateSocket(socket, next) {
  const token = extractTokenFromHandshake(socket);

  if (!token) {
    return next(new Error("Authentication required."));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("_id anonUsername role experience matchedUserId status onboardingCompleted").lean();

    if (!user) {
      return next(new Error("Authentication required."));
    }

    socket.data.user = user;
    return next();
  } catch {
    return next(new Error("Authentication required."));
  }
}

async function attachRedisAdapter(io) {
  if (!env.redisUrl) {
    return;
  }

  const { createAdapter } = await import("@socket.io/redis-adapter");
  const { createClient } = await import("redis");

  redisPubClient = createClient({ url: env.redisUrl });
  redisSubClient = redisPubClient.duplicate();

  redisPubClient.on("error", (error) => {
    logger.error({ err: error }, "Redis pub client error");
  });
  redisSubClient.on("error", (error) => {
    logger.error({ err: error }, "Redis sub client error");
  });

  await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
  io.adapter(createAdapter(redisPubClient, redisSubClient));
  logger.info("Socket.IO Redis adapter enabled");
}

export async function closeChatSocketRedis() {
  const clients = [redisPubClient, redisSubClient].filter(Boolean);
  await Promise.all(
    clients.map((client) =>
      client.quit().catch((error) => {
        logger.error({ err: error }, "Failed to close Redis client");
      })
    )
  );
  redisPubClient = undefined;
  redisSubClient = undefined;
}

export async function initializeChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  await attachRedisAdapter(io);

  setChatIo(io);
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const currentUserId = String(socket.data.user._id);
    socket.join(getUserRoomName(currentUserId));
    markUserSocketConnected(currentUserId);

    socket.on("join_conversation", async (payload, ack) => {
      try {
        const result = await createConversationForMatch(currentUserId, payload?.partnerId);
        const targetConversationId = result.conversation.id;
        socket.join(getConversationRoomName(targetConversationId));

        if (typeof ack === "function") {
          ack({ ok: true, conversation: result.conversation });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to join conversation." });
        }
      }
    });

    socket.on("send_message", async (payload, ack) => {
      try {
        const result = await sendConversationMessage(currentUserId, payload);
        socket.join(getConversationRoomName(payload?.conversationId));

        if (typeof ack === "function") {
          ack({ ok: true, ...result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to send message." });
        }
      }
    });

    socket.on("mark_seen", async (payload, ack) => {
      try {
        const message = await markMessageSeen(currentUserId, payload?.messageId);

        if (typeof ack === "function") {
          ack({ ok: true, message });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to update seen status." });
        }
      }
    });

    socket.on("exchange_request", async (payload, ack) => {
      try {
        const result = await createExchangeRequest(currentUserId, payload);
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to create exchange request." });
        }
      }
    });

    socket.on("exchange_accept", async (payload, ack) => {
      try {
        const exchange = await acceptExchangeRequest(currentUserId, payload?.exchangeId);
        if (typeof ack === "function") {
          ack({ ok: true, data: { exchange } });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to accept exchange request." });
        }
      }
    });

    socket.on("exchange_unlock_sensitive", async (payload, ack) => {
      try {
        const result = await approveSensitiveUnlock(currentUserId, payload?.exchangeId);
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to process sensitive unlock." });
        }
      }
    });

    socket.on("exchange_share_entry", async (payload, ack) => {
      try {
        const entry = await addExchangeEntry(currentUserId, payload);
        if (typeof ack === "function") {
          ack({ ok: true, data: { entry } });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to share exchange entry." });
        }
      }
    });

    // ── Interview socket events (reuse conversation:<conversationId> room) ──

    socket.on("interview_request", async (payload, ack) => {
      try {
        const result = await createInterviewRequest(currentUserId, payload);
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to send interview request." });
        }
      }
    });

    socket.on("interview_accept", async (payload, ack) => {
      try {
        const result = await acceptInterview(currentUserId, payload?.sessionId);
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to accept interview." });
        }
      }
    });

    socket.on("interview_decline", async (payload, ack) => {
      try {
        const result = await declineInterview(currentUserId, payload?.sessionId);
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to decline interview." });
        }
      }
    });

    socket.on("interview_send_question", async (payload, ack) => {
      try {
        const result = await sendQuestion(currentUserId, payload?.sessionId);
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to send question." });
        }
      }
    });

    socket.on("interview_submit_answer", async (payload, ack) => {
      try {
        const result = await submitAnswer(currentUserId, payload?.sessionId, { answer: payload?.answer });
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to submit answer." });
        }
      }
    });

    socket.on("interview_submit_feedback", async (payload, ack) => {
      try {
        const result = await submitFeedback(currentUserId, payload?.sessionId, {
          ratings: payload?.ratings,
          feedback: payload?.feedback
        });
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to submit feedback." });
        }
      }
    });

    socket.on("interview_complete", async (payload, ack) => {
      try {
        const result = await completeInterview(currentUserId, payload?.sessionId);
        if (typeof ack === "function") {
          ack({ ok: true, data: result });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message || "Unable to complete interview." });
        }
      }
    });

    socket.on("disconnect", () => {
      markUserSocketDisconnected(currentUserId);
      void pauseLiveOnlineInterviewOnDisconnect(currentUserId);
    });
  });

  return io;
}
