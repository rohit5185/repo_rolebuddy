export function apiResponse({ message, data = null }) {
  return { message, data };
}

export function sendSuccess(res, message, data = null, statusCode = 200) {
  res.status(statusCode).json({ message, data });
}
