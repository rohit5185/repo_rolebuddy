import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  acceptExchangeRequest,
  addExchangeEntry,
  approveSensitiveUnlock,
  completeExchange,
  createExchangeRequest,
  listExchangeEntries,
  listMyExchanges,
  reportExchange,
  getExchangeProfile,
  upsertExchangeProfile,
  shareSensitiveInfo
} from "./exchange.service.js";

export const createExchange = asyncHandler(async (req, res) => {
  const result = await createExchangeRequest(req.user._id, req.body);
  const statusCode = result.created ? 201 : 200;
  res.status(statusCode).json({
    message: result.created ? "Exchange request created successfully." : "Exchange request already exists.",
    data: result
  });
});

export const acceptExchange = asyncHandler(async (req, res) => {
  const exchange = await acceptExchangeRequest(req.user._id, req.params.exchangeId);
  res.status(200).json({ message: "Exchange request accepted.", data: { exchange } });
});

export const unlockSensitiveExchange = asyncHandler(async (req, res) => {
  const result = await approveSensitiveUnlock(req.user._id, req.params.exchangeId);
  res.status(200).json({ message: "Sensitive unlock preference recorded.", data: result });
});

export const createExchangeEntry = asyncHandler(async (req, res) => {
  const entry = await addExchangeEntry(req.user._id, req.body);
  res.status(201).json({ message: "Exchange entry shared successfully.", data: { entry } });
});

export const getExchangeEntries = asyncHandler(async (req, res) => {
  const page = req.query.page ?? 1;
  const limit = req.query.limit ?? 20;
  const result = await listExchangeEntries(req.user._id, req.params.exchangeId, page, limit);
  res.status(200).json({ message: "Exchange entries fetched successfully.", data: result });
});

export const getMyExchanges = asyncHandler(async (req, res) => {
  const exchanges = await listMyExchanges(req.user._id);
  res.status(200).json({ message: "Exchanges fetched successfully.", data: { exchanges } });
});

export const getMyExchangeProfile = asyncHandler(async (req, res) => {
  const data = await getExchangeProfile(req.user._id);
  res.status(200).json({ message: "Exchange profile fetched successfully.", data });
});

export const saveMyExchangeProfile = asyncHandler(async (req, res) => {
  const data = await upsertExchangeProfile(req.user._id, req.body);
  res.status(200).json({ message: "Exchange profile submitted for verification.", data });
});

export const reportExchangeAbuse = asyncHandler(async (req, res) => {
  const result = await reportExchange(req.user._id, req.body);
  res.status(200).json({ message: "Exchange report submitted.", data: result });
});

export const finishExchange = asyncHandler(async (req, res) => {
  const exchange = await completeExchange(req.user._id, req.params.exchangeId);
  res.status(200).json({ message: "Exchange marked as completed.", data: { exchange } });
});

export const shareSensitiveEntry = asyncHandler(async (req, res) => {
  const result = await shareSensitiveInfo(req.user._id, req.params.exchangeId, req.body.template);
  res.status(200).json({ message: "Sensitive information shared in chat.", data: result });
});
