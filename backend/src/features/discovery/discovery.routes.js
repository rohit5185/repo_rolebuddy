import { Router } from "express";

import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { getRoleDetail, searchRoles } from "./discovery.controller.js";

const discoveryRouter = Router();

discoveryRouter.get("/roles", verifyJwt, searchRoles);
discoveryRouter.get("/role/:roleName", verifyJwt, getRoleDetail);

export default discoveryRouter;
