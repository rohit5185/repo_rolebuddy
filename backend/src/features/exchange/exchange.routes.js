import { Router } from "express";

import { verifyJwt } from "../../middlewares/auth.middleware.js";
import {
  acceptExchange,
  createExchange,
  createExchangeEntry,
  finishExchange,
  getExchangeEntries,
  getMyExchangeProfile,
  getMyExchanges,
  reportExchangeAbuse,
  saveMyExchangeProfile,
  unlockSensitiveExchange,
  shareSensitiveEntry
} from "./exchange.controller.js";

const exchangeRouter = Router();

exchangeRouter.use(verifyJwt);

exchangeRouter.get("/", getMyExchanges);
exchangeRouter.get("/profile", getMyExchangeProfile);
exchangeRouter.put("/profile", saveMyExchangeProfile);
exchangeRouter.post("/", createExchange);
exchangeRouter.post("/:exchangeId/accept", acceptExchange);
exchangeRouter.post("/:exchangeId/unlock-sensitive", unlockSensitiveExchange);
exchangeRouter.post("/:exchangeId/share-sensitive", shareSensitiveEntry);
exchangeRouter.post("/:exchangeId/complete", finishExchange);
exchangeRouter.get("/:exchangeId/entries", getExchangeEntries);
exchangeRouter.post("/entries", createExchangeEntry);
exchangeRouter.post("/report", reportExchangeAbuse);

export default exchangeRouter;
