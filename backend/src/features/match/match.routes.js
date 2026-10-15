import { Router } from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { findMatch, rematch, promote, acceptPromotion } from "./match.controller.js";

const matchRouter = Router();

matchRouter.post("/find", verifyJwt, findMatch);
matchRouter.post("/rematch", verifyJwt, rematch);
matchRouter.post("/promote", verifyJwt, promote);
matchRouter.post("/promote/accept", verifyJwt, acceptPromotion);

export default matchRouter;
