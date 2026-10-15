import { io } from "socket.io-client";

const API_BASE = process.env.CHAT_SMOKE_API_BASE ?? "http://localhost:5000";
const SOCKET_BASE = process.env.CHAT_SMOKE_SOCKET_BASE ?? API_BASE;

function summarizeBody(body) {
  if (body === null || body === undefined) {
    return null;
  }

  if (typeof body === "string") {
    return body.slice(0, 240);
  }

  return body;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const contentType = response.headers.get("content-type") || "";

  let body = null;
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    body
  };
}

function createCookieHeader(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }

  return setCookieHeader.split(",")[0].split(";")[0];
}

function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

async function signupAndOnboard({ email, password, onboarding }) {
  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const token = signup?.body?.data?.token;
  const cookie = createCookieHeader(signup.headers.get("set-cookie"));

  if (signup.status !== 201 || typeof token !== "string") {
    throw new Error(`Signup failed for ${email}: ${JSON.stringify(summarizeBody(signup.body))}`);
  }

  const onboardingResponse = await request("/api/user/onboarding", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(onboarding)
  });

  if (onboardingResponse.status !== 200) {
    throw new Error(`Onboarding failed for ${email}: ${JSON.stringify(summarizeBody(onboardingResponse.body))}`);
  }

  return {
    email,
    token,
    cookie,
    id: onboardingResponse?.body?.data?.user?.id
  };
}

function connectSocket(token) {
  const socket = io(SOCKET_BASE, {
    transports: ["websocket"],
    auth: { token },
    reconnection: false,
    timeout: 10000
  });

  return socket;
}

function emitWithAck(socket, eventName, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(eventName, payload, (response) => {
      if (!response?.ok) {
        reject(new Error(response?.message || `Socket event ${eventName} failed.`));
        return;
      }

      resolve(response);
    });
  });
}

async function waitForEvent(socket, eventName, timeoutMs = 8000) {
  return withTimeout(
    new Promise((resolve) => {
      socket.once(eventName, (payload) => resolve(payload));
    }),
    timeoutMs,
    `Timed out waiting for ${eventName}`
  );
}

async function waitForMessageType(socket, eventName, expectedType, timeoutMs = 8000) {
  return withTimeout(
    new Promise((resolve) => {
      const handler = (payload) => {
        if (payload?.type === expectedType) {
          socket.off(eventName, handler);
          resolve(payload);
        }
      };

      socket.on(eventName, handler);
    }),
    timeoutMs,
    `Timed out waiting for ${expectedType} on ${eventName}`
  );
}

async function run() {
  const suffix = Date.now();
  const password = "TestPass123!";
  const role = `ChatSmoke-${suffix}`;
  const checks = [];
  const failures = [];

  const addCheck = (name, pass, details) => {
    checks.push({ name, pass, details: summarizeBody(details) });
    if (!pass) {
      failures.push(name);
    }
  };

  const userA = await signupAndOnboard({
    email: `chat.a+${suffix}@example.com`,
    password,
    onboarding: { role, experience: "experienced", dailyGoal: 2, availability: "morning" }
  });

  const userB = await signupAndOnboard({
    email: `chat.b+${suffix}@example.com`,
    password,
    onboarding: { role, experience: "experienced", dailyGoal: 2, availability: "morning" }
  });

  const matchA = await request("/api/match/find", {
    method: "POST",
    headers: { Authorization: `Bearer ${userA.token}` }
  });
  const matchB = await request("/api/match/find", {
    method: "POST",
    headers: { Authorization: `Bearer ${userB.token}` }
  });

  addCheck("matching returns matched users", matchA.status === 200 && matchB.status === 200, {
    matchA: summarizeBody(matchA.body),
    matchB: summarizeBody(matchB.body)
  });

  const conversationResponse = await request("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userA.token}`
    },
    body: JSON.stringify({ partnerId: userB.id })
  });

  addCheck("conversation create succeeds", conversationResponse.status === 201 || conversationResponse.status === 200, conversationResponse.body);

  const conversation = conversationResponse?.body?.data?.conversation;
  const conversationId = conversation?.id;

  addCheck("conversation has id", typeof conversationId === "string" && conversationId.length > 10, conversationResponse.body);

  const messageHistory = await request(`/api/messages/${conversationId}`, {
    headers: { Authorization: `Bearer ${userA.token}` }
  });

  addCheck("message history loads", messageHistory.status === 200, messageHistory.body);

  const initialMessages = messageHistory?.body?.data?.messages ?? [];
  const checkinMessage = initialMessages.find((message) => message.type === "checkin" && message.metadata?.kind === "daily_checkin");

  addCheck("daily check-in exists", Boolean(checkinMessage), initialMessages);

  const socketA = connectSocket(userA.token);
  const socketB = connectSocket(userB.token);

  await Promise.all([
    withTimeout(
      new Promise((resolve, reject) => {
        socketA.on("connect", resolve);
        socketA.on("connect_error", reject);
      }),
      8000,
      "socketA connection timed out"
    ),
    withTimeout(
      new Promise((resolve, reject) => {
        socketB.on("connect", resolve);
        socketB.on("connect_error", reject);
      }),
      8000,
      "socketB connection timed out"
    )
  ]);

  const joinA = await emitWithAck(socketA, "join_conversation", { conversationId });
  const joinB = await emitWithAck(socketB, "join_conversation", { conversationId });
  addCheck("socket join conversation succeeds", Boolean(joinA.ok && joinB.ok), { joinA, joinB });

  const textPayload = {
    conversationId,
    type: "text",
    content: "Realtime smoke test message",
    metadata: { clientMessageId: `text-${suffix}` }
  };

  const receivePromise = waitForEvent(socketB, "receive_message");
  const nextMessageFromAck = await emitWithAck(socketA, "send_message", textPayload);
  const receivedByPartner = await receivePromise;

  addCheck("partner receives realtime message", receivedByPartner?.id === nextMessageFromAck?.message?.id, {
    ack: nextMessageFromAck,
    receivedByPartner
  });

  const duplicateSendAck = await emitWithAck(socketA, "send_message", textPayload);
  addCheck("duplicate clientMessageId returns same message", duplicateSendAck?.message?.id === nextMessageFromAck?.message?.id, {
    first: nextMessageFromAck,
    duplicate: duplicateSendAck
  });

  const seenAck = await emitWithAck(socketB, "mark_seen", { messageId: nextMessageFromAck.message.id });
  addCheck("mark_seen succeeds", Boolean(seenAck?.message?.seenBy?.includes(userB.id)), seenAck);

  const checkinId = checkinMessage?.id;
  const checkinResponsePayload = {
    conversationId,
    type: "checkin",
    metadata: {
      clientMessageId: `checkin-${suffix}`,
      sourceCheckinId: checkinId,
      status: "not_done",
      dateKey: new Date().toISOString().slice(0, 10)
    }
  };

  const alertPromise = waitForMessageType(socketB, "receive_message", "alert");
  const checkinAck = await emitWithAck(socketA, "send_message", checkinResponsePayload);
  const alertFromPartnerView = await alertPromise;

  addCheck("not_done triggers alert", alertFromPartnerView?.type === "alert", {
    checkinAck,
    alertFromPartnerView
  });

  const refreshedMessages = await request(`/api/messages/${conversationId}`, {
    headers: { Authorization: `Bearer ${userA.token}` }
  });

  const refreshedList = refreshedMessages?.body?.data?.messages ?? [];
  const alertMessage = refreshedList.find((message) => message.type === "alert");
  const finalCheckin = refreshedList.find((message) => message.type === "checkin" && message.metadata?.kind === "checkin_response");

  addCheck("alert persisted in db", Boolean(alertMessage), refreshedList);
  addCheck("checkin response persisted in db", Boolean(finalCheckin), refreshedList);

  socketA.disconnect();
  socketB.disconnect();

  console.log("\nChat API smoke test results:");
  for (const check of checks) {
    console.log(`${check.pass ? "PASS" : "FAIL"} - ${check.name}`);
  }

  if (failures.length > 0) {
    console.error(`\nFailed checks (${failures.length}):`);
    for (const item of failures) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("\nAll chat smoke checks passed.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Chat smoke test crashed:", error);
  process.exit(1);
});