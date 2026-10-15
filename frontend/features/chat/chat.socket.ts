import { io, type Socket } from "socket.io-client";

import type { ChatMessage, ChatSocketPayload, SendMessagePayload } from "./types";

type AckResponse<T> = {
  ok: boolean;
  message?: string | ChatMessage;
  conversation?: T;
  alert?: ChatMessage | null;
  data?: T;
  conversationId?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

function getSocketBaseUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export function createChatSocket(): Socket {
  return io(getSocketBaseUrl(), {
    autoConnect: false,
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 800,
    timeout: 10000
  });
}

export function emitWithAck<TResponse>(socket: Socket, eventName: string, payload: ChatSocketPayload | SendMessagePayload): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    socket.emit(eventName, payload, (response: AckResponse<TResponse>) => {
      if (!response?.ok) {
        const errorMessage = typeof response.message === "string" ? response.message : "Socket request failed.";
        reject(new Error(errorMessage));
        return;
      }

      const resolvedValue =
        response.message && typeof response.message === "object"
          ? response.message
          : response.conversation ?? response.data;
      resolve(resolvedValue as TResponse);
    });
  });
}