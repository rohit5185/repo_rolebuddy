let chatIo = null;
const onlineUsers = new Map();

export function setChatIo(io) {
  chatIo = io;
}

export function getConversationRoomName(conversationId) {
  return `conversation:${conversationId}`;
}

export function getUserRoomName(userId) {
  return `user:${userId}`;
}

export function emitToConversation(conversationId, eventName, payload) {
  if (!chatIo) {
    return;
  }

  chatIo.to(getConversationRoomName(conversationId)).emit(eventName, payload);
}

export function emitToUser(userId, eventName, payload) {
  if (!chatIo) {
    return;
  }

  chatIo.to(getUserRoomName(userId)).emit(eventName, payload);
}

export function markUserSocketConnected(userId) {
  const key = String(userId);
  const currentCount = onlineUsers.get(key) ?? 0;
  onlineUsers.set(key, currentCount + 1);
}

export function markUserSocketDisconnected(userId) {
  const key = String(userId);
  const currentCount = onlineUsers.get(key) ?? 0;
  if (currentCount <= 1) {
    onlineUsers.delete(key);
    return;
  }
  onlineUsers.set(key, currentCount - 1);
}

export function isUserOnline(userId) {
  return (onlineUsers.get(String(userId)) ?? 0) > 0;
}

export function areUsersOnline(userIds = []) {
  return userIds.every((userId) => isUserOnline(userId));
}
